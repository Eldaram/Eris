import prisma from '../config/prisma';
import { NotificationService } from './notification.service';

type ServerErrorCode = 'INVALID_SERVER_NAME' | 'SERVER_CREATION_FAILED';

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
}
