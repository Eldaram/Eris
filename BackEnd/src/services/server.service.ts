import { randomUUID } from 'crypto';
import prisma from '../config/prisma';
import { NotificationService } from './notification.service';

type ServerErrorCode =
    | 'INVALID_SERVER_NAME'
    | 'SERVER_CREATION_FAILED'
    | 'ACCESS_DENIED'
    | 'SERVER_NOT_FOUND'
    | 'INVITE_CREATION_FAILED'
    | 'INVITE_NOT_FOUND'
    | 'INVITE_EXPIRED'
    | 'INVITE_REDEMPTION_FAILED';

export class ServerInputError extends Error {
    constructor(
        public readonly code: ServerErrorCode,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'ServerInputError';
    }
}

export class ServerService {
    private static readonly INVITE_TTL_MS = 24 * 60 * 60 * 1000;

    private static getInviteBaseUrl() {
        return process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    private static buildInviteUrl(code: string) {
        return new URL(`/invite/${encodeURIComponent(code)}`, this.getInviteBaseUrl()).toString();
    }

    /**
     * Creates a new server owned by the given user.
     * Atomically:
     * 1. Creates the Server record.
     * 2. Adds the owner to the server's user list (UserPerServer).
     * 3. Creates a default "general" room in the server.
     *
     * @returns The ID of the newly created server.
     */
    static async createServer(input: { name: string; ownerId: string }): Promise<{ id: string }> {
        const name = input.name.trim();

        if (!name) {
            throw new ServerInputError('INVALID_SERVER_NAME', 'Server name is required.');
        }
        if (name.length < 1 || name.length > 100) {
            throw new ServerInputError('INVALID_SERVER_NAME', 'Server name must be between 1 and 100 characters.');
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create the server
                const server = await tx.server.create({
                    data: {
                        name,
                        ownerId: input.ownerId,
                    },
                });

                // 2. Add the owner to the server's user list
                await tx.userPerServer.create({
                    data: {
                        userId: input.ownerId,
                        serverId: server.id,
                    },
                });

                // 3. Create the default "general" room
                await tx.room.create({
                    data: {
                        name: 'general',
                        serverId: server.id,
                        isDm: false,
                    },
                });

                return { id: server.id, name: server.name };
            });

            // Emit notification after successful server creation
            try {
                NotificationService.notifyServerCreated(result.id, result.name, input.ownerId);
            } catch (notifError) {
                // Log but don't fail the operation if notification fails
                console.error('Failed to send server creation notification:', notifError);
            }

            return { id: result.id };
        } catch (error) {
            if (error instanceof ServerInputError) {
                throw error;
            }
            console.error('Unexpected error while creating server:', error);
            throw new ServerInputError('SERVER_CREATION_FAILED', 'Failed to create the server.', 500);
        }
    }

    /**
     * Returns the list of servers the given user is a member of.
     */
    static async listServersForUser(userId: string): Promise<Array<{ id: string; name: string; ownerId: string }>> {
        const servers = await prisma.server.findMany({
            where: {
                users: {
                    some: { userId },
                },
            },
            select: {
                id: true,
                name: true,
                ownerId: true,
            },
            orderBy: { name: 'asc' },
        });

        return servers;
    }

    /**
     * Returns channels (rooms) for a server if the requester is a member.
     */
    static async listChannelsForServer(input: { serverId: string; requesterId: string }) {
        const { serverId, requesterId } = input;

        // Verify membership
        const membership = await prisma.userPerServer.findFirst({
            where: {
                serverId,
                userId: requesterId,
            },
        });

        if (!membership) {
            throw new ServerInputError('ACCESS_DENIED', 'Access denied to server channels.', 403);
        }

        const channels = await prisma.room.findMany({
            where: { serverId },
            select: {
                id: true,
                name: true,
                isDm: true,
            },
            orderBy: { name: 'asc' },
        });

        return channels;
    }

    /**
     * Creates an invitation link for a server if the creator is a member of that server.
     * The invite is valid for 24 hours.
     */
    static async createInviteLink(input: { serverId: string; creatorId: string }): Promise<{ inviteUrl: string; expiresAt: string; code: string }> {
        const expiresAt = new Date(Date.now() + this.INVITE_TTL_MS);

        try {
            const invite = await prisma.$transaction(async (tx) => {
                const server = await tx.server.findUnique({
                    where: { id: input.serverId },
                    select: { id: true },
                });

                if (!server) {
                    throw new ServerInputError('SERVER_NOT_FOUND', 'Server not found.', 404);
                }

                const membership = await tx.userPerServer.findFirst({
                    where: {
                        serverId: input.serverId,
                        userId: input.creatorId,
                    },
                    select: {
                        userId: true,
                    },
                });

                if (!membership) {
                    throw new ServerInputError('ACCESS_DENIED', 'Access denied to create an invite for this server.', 403);
                }

                return tx.serverInvite.create({
                    data: {
                        serverId: input.serverId,
                        creatorId: input.creatorId,
                        code: randomUUID(),
                        expiresAt,
                    },
                    select: {
                        code: true,
                        expiresAt: true,
                    },
                });
            });

            return {
                inviteUrl: this.buildInviteUrl(invite.code),
                expiresAt: invite.expiresAt.toISOString(),
                code: invite.code,
            };
        } catch (error) {
            if (error instanceof ServerInputError) {
                throw error;
            }

            console.error('Unexpected error while creating an invite link:', error);
            throw new ServerInputError('INVITE_CREATION_FAILED', 'Failed to create the invitation link.', 500);
        }
    }

    /**
     * Redeems an invite code for the authenticated user.
     * If the user is already a server member, the operation is a no-op.
     */
    static async redeemInvite(input: { code: string; userId: string }): Promise<{ serverId: string; joined: boolean; alreadyMember: boolean }> {
        try {
            const invite = await prisma.serverInvite.findUnique({
                where: { code: input.code },
                select: {
                    serverId: true,
                    expiresAt: true,
                },
            });

            if (!invite) {
                throw new ServerInputError('INVITE_NOT_FOUND', 'Invitation link not found.', 404);
            }

            const membership = await prisma.userPerServer.findFirst({
                where: {
                    serverId: invite.serverId,
                    userId: input.userId,
                },
                select: {
                    userId: true,
                },
            });

            if (membership) {
                return {
                    serverId: invite.serverId,
                    joined: false,
                    alreadyMember: true,
                };
            }

            if (invite.expiresAt.getTime() < Date.now()) {
                throw new ServerInputError('INVITE_EXPIRED', 'Invitation link has expired.', 410);
            }

            const result = await prisma.userPerServer.createMany({
                data: [
                    {
                        serverId: invite.serverId,
                        userId: input.userId,
                    },
                ],
                skipDuplicates: true,
            });

            return {
                serverId: invite.serverId,
                joined: result.count > 0,
                alreadyMember: false,
            };
        } catch (error) {
            if (error instanceof ServerInputError) {
                throw error;
            }

            console.error('Unexpected error while redeeming an invite link:', error);
            throw new ServerInputError('INVITE_REDEMPTION_FAILED', 'Failed to join the server from the invitation link.', 500);
        }
    }

    /**
     * Returns server details for an invite so the client can display a confirmation popup.
     * If the authenticated user is already a member, the server name is still returned.
     */
    static async getInvitePreview(input: { code: string; userId: string }): Promise<{ serverName: string; alreadyMember: boolean }> {
        try {
            const invite = await prisma.serverInvite.findUnique({
                where: { code: input.code },
                select: {
                    serverId: true,
                    expiresAt: true,
                    server: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            if (!invite) {
                throw new ServerInputError('INVITE_NOT_FOUND', 'Invitation link not found.', 404);
            }

            if (invite.expiresAt.getTime() < Date.now()) {
                throw new ServerInputError('INVITE_EXPIRED', 'Invitation link has expired.', 410);
            }

            const membership = await prisma.userPerServer.findFirst({
                where: {
                    serverId: invite.serverId,
                    userId: input.userId,
                },
                select: {
                    userId: true,
                },
            });

            return {
                serverName: invite.server.name,
                alreadyMember: Boolean(membership),
            };
        } catch (error) {
            if (error instanceof ServerInputError) {
                throw error;
            }

            console.error('Unexpected error while loading invite preview:', error);
            throw new ServerInputError('INVITE_REDEMPTION_FAILED', 'Failed to load the invitation preview.', 500);
        }
    }
}
