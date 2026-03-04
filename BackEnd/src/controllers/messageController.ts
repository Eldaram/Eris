import { Request, Response } from 'express';
import { Message } from '../models/message';

export const createMessage = async (req: Request, res: Response) => {
    try {
        const { room_id, author_id, content } = req.body;

        if (!room_id || !author_id || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newMessage = new Message({
            room_id,
            author_id,
            content
        });

        const savedMessage = await newMessage.save();
        return res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// TODO This will need review. A room can have a lot of messages, so this will need to be paginated.
export const getMessagesByRoom = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const messages = await Message.find({ room_id: roomId }).sort({ createdAt: 1 });

        return res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
