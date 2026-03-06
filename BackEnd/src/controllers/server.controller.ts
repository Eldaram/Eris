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
}
