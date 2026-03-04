import mongoose from 'mongoose';
import { Message } from '../src/models/message';
import { randomUUID } from 'crypto';

describe('MongoDB Connection and Models', () => {
    beforeAll(async () => {
        // Connect directly here for tests
        const uri = process.env.MONGO_URI || 'mongodb://root:rootpassword@127.0.0.1:27017/eris_test?authSource=admin';
        await mongoose.connect(uri);
        // Clear the collection before tests
        await Message.deleteMany({});
    });

    afterAll(async () => {
        // Clear to leave clean state and disconnect
        await Message.deleteMany({});
        await mongoose.disconnect();
    });

    it('should connect to MongoDB and create a message', async () => {
        const roomId = randomUUID();
        const authorId = randomUUID();

        const message = new Message({
            room_id: roomId,
            author_id: authorId,
            content: 'Hello, World! This is a test message.'
        });

        const savedMessage = await message.save();

        expect(savedMessage._id).toBeDefined();
        expect(savedMessage.room_id).toBe(roomId);
        expect(savedMessage.author_id).toBe(authorId);
        expect(savedMessage.content).toBe('Hello, World! This is a test message.');
        expect(savedMessage.createdAt).toBeDefined();
        expect(savedMessage.updatedAt).toBeDefined();
    });
});
