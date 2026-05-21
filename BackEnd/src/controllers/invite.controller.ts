import { Request, Response } from 'express';
import { ServerInputError, ServerService } from '../services/server.service';

export class InviteController {
    static async getInvitePreview(req: Request, res: Response) {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        const { code } = req.params;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Invitation token is required.', code: 'INVALID_INVITE_TOKEN' });
        }

        try {
            const result = await ServerService.getInvitePreview({
                code,
                userId: user.id,
            });

            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({ error: error.message, code: error.code });
            }

            console.error('Unexpected error while loading invite preview:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async redeemInvite(req: Request, res: Response) {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
        }

        const { code } = req.params;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Invitation token is required.', code: 'INVALID_INVITE_TOKEN' });
        }

        try {
            const result = await ServerService.redeemInvite({
                code,
                userId: user.id,
            });

            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof ServerInputError) {
                return res.status(error.statusCode).json({ error: error.message, code: error.code });
            }

            console.error('Unexpected error while redeeming an invite link:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}