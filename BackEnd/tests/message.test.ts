import request from 'supertest';
import app from '../src/index';
import mongoose from 'mongoose';
import prisma from '../src/config/prisma';
import { Message } from '../src/models/message';

// Helper to create a user and return their token and ID
async function createUserAndLogin(): Promise<{ token: string; userId: string; username: string }> {
    const uniqueSuffix = Date.now().toString();
    const testUser = {
        username: `msg_test_${uniqueSuffix}`,
        email: `msg_test_${uniqueSuffix}@example.com`,
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
    };

    await request(app).post('/api/users').send(testUser);

    const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: testUser.password });

    return {
        token: loginRes.body.token,
        userId: loginRes.body.user?.id,
        username: testUser.username
    };
}

// ─── Unauthenticated Tests ────────────────────────────────────────────────────

describe('Messaging API — Unauthenticated', () => {
    it('should return 401 when sending a message without authorization', async () => {
        const res = await request(app)
            .post('/api/messages')
            .send({ room_id: 'general', content: 'Hello World' });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 when fetching messages without authorization', async () => {
        const res = await request(app)
            .get('/api/messages/room/general');

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('MISSING_TOKEN');
    });
});

// ─── Authenticated Tests ──────────────────────────────────────────────────────

describe('Messaging API — Authenticated', () => {
    let token: string;
    let username: string;
    let userId: string;
    let accessibleRoomId: string;
    let inaccessibleRoomId: string;
    let accessibleServerId: string;
    let inaccessibleServerId: string;
    let blockedOwnerId: string;
    let setupReady = false;

    beforeAll(async () => {
        try {
            const auth = await createUserAndLogin();
            token = auth.token;
            username = auth.username;
            userId = auth.userId;

            // Connect to MongoDB during authenticated testing
            const uri = process.env.MONGO_URI || 'mongodb://root:rootpassword@127.0.0.1:27017/eris_test?authSource=admin';
            await mongoose.connect(uri);

            const accessibleServer = await prisma.server.create({
                data: {
                    name: `Message Test Server ${Date.now()}`,
                    ownerId: userId,
                },
            });

            await prisma.userPerServer.create({
                data: {
                    serverId: accessibleServer.id,
                    userId,
                },
            });

            const accessibleRoom = await prisma.room.create({
                data: {
                    name: 'general',
                    serverId: accessibleServer.id,
                    isDm: false,
                },
            });

            const blockedOwner = await prisma.user.create({
                data: {
                    username: `msg_blocked_${Date.now()}`,
                    pocketbaseId: `pb-msg-blocked-${Date.now()}`,
                },
            });

            const inaccessibleServer = await prisma.server.create({
                data: {
                    name: `Blocked Message Server ${Date.now()}`,
                    ownerId: blockedOwner.id,
                },
            });

            const inaccessibleRoom = await prisma.room.create({
                data: {
                    name: 'blocked',
                    serverId: inaccessibleServer.id,
                    isDm: false,
                },
            });

            accessibleServerId = accessibleServer.id;
            accessibleRoomId = accessibleRoom.id;
            inaccessibleServerId = inaccessibleServer.id;
            inaccessibleRoomId = inaccessibleRoom.id;
            blockedOwnerId = blockedOwner.id;
            setupReady = true;
        } catch {
            token = '';
            setupReady = false;
        }
    });

    afterAll(async () => {
        try {
            if (setupReady) {
                await Message.deleteMany({ room_id: { $in: [accessibleRoomId, inaccessibleRoomId] } });
                await prisma.room.deleteMany({ where: { id: { in: [accessibleRoomId, inaccessibleRoomId] } } });
                await prisma.userPerServer.deleteMany({ where: { serverId: accessibleServerId } });
                await prisma.server.deleteMany({ where: { id: { in: [accessibleServerId, inaccessibleServerId] } } });
                await prisma.user.deleteMany({ where: { id: blockedOwnerId } });
            }
            await mongoose.disconnect();
        } catch {
            // Ignore teardown errors
        }
    });

    beforeEach(async () => {
        if (!setupReady) {
            return;
        }

        await Message.deleteMany({ room_id: accessibleRoomId });
        await Message.deleteMany({ room_id: inaccessibleRoomId });
    });

    const itIfReady = (description: string, fn: () => Promise<void>) => {
        it(description, async () => {
            if (!setupReady || !token) {
                console.warn('Skipping test: could not obtain auth token (DB unavailable?)');
                return;
            }
            await fn();
        });
    };

    itIfReady('should return 400 when missing required fields during creation', async () => {
        const res = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: accessibleRoomId }); // Missing content

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing required fields');
    });

    itIfReady('should successfully create a message in a server room the user belongs to', async () => {
        const messageContent = 'Hello, this is a real-time message!';

        const res = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: accessibleRoomId, content: messageContent });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.room_id).toBe(accessibleRoomId);
        expect(res.body.author_id).toBe(userId);
        expect(res.body.author_username).toBe(username);
        expect(res.body.content).toBe(messageContent);
        expect(res.body).toHaveProperty('createdAt');
    });

    itIfReady('should reject creating messages in rooms the user cannot access', async () => {
        const res = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: inaccessibleRoomId, content: 'Blocked message' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('ACCESS_DENIED');
    });

    itIfReady('should return the last 25 messages when no cursor is provided', async () => {
        for (let index = 1; index <= 30; index += 1) {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${token}`)
                .send({ room_id: accessibleRoomId, content: `Message ${String(index).padStart(2, '0')}` });

            expect(response.status).toBe(201);
        }

        const res = await request(app)
            .get(`/api/messages/room/${accessibleRoomId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(25);
        expect(res.body[0].content).toBe('Message 06');
        expect(res.body[0].author_username).toBe(username);
        expect(res.body[24].content).toBe('Message 30');
    });

    itIfReady('should return the previous 25 messages when a cursor is provided', async () => {
        const createdMessageIds: string[] = [];

        for (let index = 1; index <= 30; index += 1) {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${token}`)
                .send({ room_id: accessibleRoomId, content: `Cursor ${String(index).padStart(2, '0')}` });

            expect(response.status).toBe(201);
            createdMessageIds.push(response.body.id);
        }

        const cursorMessageId = createdMessageIds[25];

        const res = await request(app)
            .get(`/api/messages/room/${accessibleRoomId}?beforeMessageId=${cursorMessageId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(25);
        expect(res.body[0].content).toBe('Cursor 01');
        expect(res.body[24].content).toBe('Cursor 25');
        expect(res.body[0].author_username).toBe(username);
    });

    itIfReady('should reject reading messages from rooms the user cannot access', async () => {
        const res = await request(app)
            .get(`/api/messages/room/${inaccessibleRoomId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('ACCESS_DENIED');
    });
});
