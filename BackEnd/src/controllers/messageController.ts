import { Request, Response } from 'express';
import { MessageInputError, MessageService } from '../services/messageService';

const isMessageInputError = (error: unknown): error is MessageInputError => error instanceof MessageInputError;

/**
 * Creates a new message in a room.
 * The author's user ID is securely resolved from the authentication token.
 * After successfully saving the message, a real-time notification is emitted via Socket.IO.
 */
export const createMessage = async (req: Request, res: Response) => {
    try {
        const { room_id, content } = req.body;
        const author_id = req.user?.id; // Injected by authMiddleware

        if (!room_id || !author_id || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const responseData = await MessageService.createMessage({
            roomId: room_id,
            authorId: author_id,
            content,
        });

        return res.status(201).json(responseData);
    } catch (error: unknown) {
        if (isMessageInputError(error)) {
            return res.status(error.statusCode).json({
                error: error.message,
                code: error.code,
            });
        }

        console.error('[MessageController] Error creating message:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Fetches all historic messages for a specific room.
 * Implements N+1 query optimization by batch-fetching usernames from PostgreSQL.
 */
export const getMessagesByRoom = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const beforeMessageId = typeof req.query.beforeMessageId === 'string' ? req.query.beforeMessageId : undefined;

        const messages = await MessageService.getMessagesByRoom({
            roomId,
            requesterId: req.user?.id,
            beforeMessageId,
        });

        return res.status(200).json(messages);
    } catch (error: unknown) {
        if (isMessageInputError(error)) {
            return res.status(error.statusCode).json({
                error: error.message,
                code: error.code,
            });
        }

        console.error('[MessageController] Error fetching messages:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
