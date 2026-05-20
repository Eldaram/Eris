import { Request, Response } from 'express';
import { Message } from '../models/message';
import prisma from '../config/prisma';
import { NotificationService } from '../services/notification.service';

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

        // Fetch author's username from PostgreSQL to return to the client
        const author = await prisma.user.findUnique({
            where: { id: author_id },
        });
        const author_username = author ? author.username : 'User';

        const newMessage = new Message({
            room_id,
            author_id,
            content,
        });

        const savedMessage = await newMessage.save();

        const responseData = {
            id: savedMessage.id || savedMessage._id,
            room_id: savedMessage.room_id,
            author_id: savedMessage.author_id,
            author_username,
            content: savedMessage.content,
            createdAt: savedMessage.createdAt,
            updatedAt: savedMessage.updatedAt,
        };

        // Emit real-time message received notification via Socket.IO
        try {
            NotificationService.emitToRoom(room_id, {
                type: 'message:received',
                timestamp: Date.now(),
                data: {
                    messageId: String(savedMessage.id || savedMessage._id),
                    roomId: room_id,
                    senderId: author_id,
                    senderUsername: author_username,
                    content: savedMessage.content,
                },
            });
        } catch (socketError) {
            console.error('[MessageController] Failed to emit message notification:', socketError);
        }

        return res.status(201).json(responseData);
    } catch (error) {
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
        
        // Find messages sorted chronologically
        const messages = await Message.find({ room_id: roomId }).sort({ createdAt: 1 });

        // Extract distinct author IDs to perform a single batch query
        const authorIds = Array.from(new Set(messages.map(m => m.author_id).filter(Boolean)));
        
        const users = await prisma.user.findMany({
            where: { id: { in: authorIds } },
        });

        // Create a fast-lookup map for usernames
        const userMap = new Map(users.map(u => [u.id, u.username]));

        const messagesWithUsername = messages.map(msg => ({
            id: msg.id || msg._id,
            room_id: msg.room_id,
            author_id: msg.author_id,
            author_username: userMap.get(msg.author_id) || 'User',
            content: msg.content,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
        }));

        return res.status(200).json(messagesWithUsername);
    } catch (error) {
        console.error('[MessageController] Error fetching messages:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
