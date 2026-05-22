import { ObjectId } from 'mongodb';
import prisma from '../config/prisma';
import { Message, IMessage } from '../models/message';
import { NotificationService } from './notification.service';

type MessageErrorCode =
    | 'ROOM_NOT_FOUND'
    | 'ACCESS_DENIED'
    | 'MESSAGE_NOT_FOUND'
    | 'MESSAGE_CREATE_FAILED'
    | 'MESSAGE_FETCH_FAILED';

export class MessageInputError extends Error {
    constructor(
        public readonly code: MessageErrorCode,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'MessageInputError';
    }
}

export type MessageResponse = {
    id: string;
    room_id: string;
    author_id: string;
    author_username: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
};

export class MessageService {
    private static readonly PAGE_SIZE = 25;

    static async createMessage(input: { roomId: string; authorId: string; content: string }): Promise<MessageResponse> {
        const room = await this.assertRoomAccess(input.roomId, input.authorId);

        try {
            const author = await prisma.user.findUnique({
                where: { id: input.authorId },
            });

            const authorUsername = author ? author.username : 'User';

            const savedMessage = await new Message({
                room_id: room.id,
                author_id: input.authorId,
                content: input.content,
            }).save();

            const response = this.serializeMessage(savedMessage, authorUsername);

            try {
                NotificationService.emitToRoom(room.id, {
                    type: 'message:received',
                    timestamp: Date.now(),
                    data: {
                        messageId: response.id,
                        roomId: room.id,
                        senderId: input.authorId,
                        senderUsername: authorUsername,
                        content: response.content,
                    },
                });
            } catch (socketError) {
                console.error('[MessageService] Failed to emit message notification:', socketError);
            }

            return response;
        } catch (error) {
            if (error instanceof MessageInputError) {
                throw error;
            }

            console.error('Unexpected error while creating a message:', error);
            throw new MessageInputError('MESSAGE_CREATE_FAILED', 'Failed to create the message.', 500);
        }
    }

    static async getMessagesByRoom(input: { roomId: string; requesterId: string; beforeMessageId?: string }): Promise<MessageResponse[]> {
        await this.assertRoomAccess(input.roomId, input.requesterId);

        try {
            let cursorId: ObjectId | undefined;

            if (input.beforeMessageId) {
                const cursorMessage = await Message.findOne({
                    _id: input.beforeMessageId,
                    room_id: input.roomId,
                });

                if (!cursorMessage) {
                    throw new MessageInputError('MESSAGE_NOT_FOUND', 'Message cursor not found.', 404);
                }

                cursorId = new ObjectId(cursorMessage._id.toString());
            }

            const filter: Record<string, unknown> = {
                room_id: input.roomId,
            };

            if (cursorId) {
                filter._id = { $lt: cursorId };
            }

            const messages = await Message.find(filter)
                .sort({ _id: -1 })
                .limit(this.PAGE_SIZE);

            const orderedMessages = messages.reverse();

            return this.attachUsernames(orderedMessages);
        } catch (error) {
            if (error instanceof MessageInputError) {
                throw error;
            }

            console.error('Unexpected error while fetching messages:', error);
            throw new MessageInputError('MESSAGE_FETCH_FAILED', 'Failed to fetch the messages.', 500);
        }
    }

    private static async assertRoomAccess(roomId: string, userId: string) {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: {
                id: true,
                serverId: true,
                isDm: true,
            },
        });

        if (!room) {
            throw new MessageInputError('ROOM_NOT_FOUND', 'Room not found.', 404);
        }

        if (!room.serverId || room.isDm) {
            throw new MessageInputError('ACCESS_DENIED', 'Messages are only available in server rooms.', 403);
        }

        const membership = await prisma.userPerServer.findFirst({
            where: {
                serverId: room.serverId,
                userId,
            },
            select: {
                userId: true,
            },
        });

        if (!membership) {
            throw new MessageInputError('ACCESS_DENIED', 'Access denied to this room.', 403);
        }

        return room;
    }

    private static async attachUsernames(messages: IMessage[]): Promise<MessageResponse[]> {
        const authorIds = Array.from(new Set(messages.map((message) => message.author_id).filter(Boolean)));

        const users = await prisma.user.findMany({
            where: { id: { in: authorIds } },
        });

        const userMap = new Map(users.map((user) => [user.id, user.username]));

        return messages.map((message) => this.serializeMessage(message, userMap.get(message.author_id) || 'User'));
    }

    private static serializeMessage(message: IMessage, authorUsername: string): MessageResponse {
        const mongoMessage = message as IMessage & { id?: string };

        return {
            id: mongoMessage.id || mongoMessage._id.toString(),
            room_id: message.room_id,
            author_id: message.author_id,
            author_username: authorUsername,
            content: message.content,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        };
    }
}