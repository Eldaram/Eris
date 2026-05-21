import { Request, Response } from 'express';
import { ServerService, ServerInputError } from '../services/server.service';

export class ServerController {
    /**
     * POST /api/servers
     * Creates a new server for the authenticated user.
     * The user is automatically added to the server and a "general" room is created.
     */
    static async createServer(req: Request, res: Response) {
        const user = req.user;

        // Guard: should never happen if authMiddleware is applied,
        // but kept as a safety net.
        if (!user) {
            return res.status(401).json({
                error: 'Authentication required.',
                code: 'UNAUTHORIZED',
            });
        }

        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Server name is required.',
                code: 'INVALID_SERVER_NAME',
            });
        }

        try {
            const result = await ServerService.createServer({
                name,
                ownerId: user.id,
            });

            return res.status(200).json({ id: result.id });
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                });
            }

            console.error('Unexpected error while creating server:', error);

            if (process.env.NODE_ENV !== 'production') {
                return res.status(500).json({
                    error: 'Internal Server Error',
                    details: error instanceof Error ? error.message : String(error),
                });
            }

            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async listServers(req: Request, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        try {
            const servers = await ServerService.listServersForUser(user.id);
            return res.status(200).json({ servers });
        } catch (error) {
            console.error('Unexpected error while listing servers:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getChannels(req: Request, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        const { serverId } = req.params;
        if (!serverId) {
            return res.status(400).json({ error: 'serverId is required.', code: 'INVALID_SERVER_ID' });
        }

        try {
            const channels = await ServerService.listChannelsForServer({ serverId, requesterId: user.id });
            return res.status(200).json({ channels });
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({ error: error.message, code: error.code });
            }
            console.error('Unexpected error while listing channels:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getOwnership(req: Request, res: Response) {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        const { serverId } = req.params;

        if (!serverId) {
            return res.status(400).json({ error: 'serverId is required.', code: 'INVALID_SERVER_ID' });
        }

        try {
            const result = await ServerService.isServerOwner({
                serverId,
                userId: user.id,
            });

            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({ error: error.message, code: error.code });
            }

            console.error('Unexpected error while checking server ownership:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async createRoom(req: Request, res: Response) {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        const { serverId } = req.params;

        if (!serverId) {
            return res.status(400).json({ error: 'serverId is required.', code: 'INVALID_SERVER_ID' });
        }

        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Room name is required.', code: 'INVALID_ROOM_NAME' });
        }

        try {
            const room = await ServerService.createRoom({
                serverId,
                userId: user.id,
                name,
            });

            return res.status(201).json({
                success: true,
                room,
            });
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({ error: error.message, code: error.code });
            }

            console.error('Unexpected error while creating a room:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async createInvite(req: Request, res: Response) {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        const { serverId } = req.params;

        if (!serverId) {
            return res.status(400).json({ error: 'serverId is required.', code: 'INVALID_SERVER_ID' });
        }

        try {
            const invite = await ServerService.createInviteLink({
                serverId,
                creatorId: user.id,
            });

            return res.status(201).json(invite);
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({ error: error.message, code: error.code });
            }

            console.error('Unexpected error while creating an invite link:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
