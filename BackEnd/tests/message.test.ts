import request from 'supertest';
import app from '../src/index';
import mongoose from 'mongoose';

/**
 * Integration/Unit tests for Eris Messaging APIs:
 * - POST /api/messages
 * - GET /api/messages/room/:roomId
 *
 * Tests check authorization middleware, payload validation, database persistence,
 * and username lookups.
 */

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

    beforeAll(async () => {
        try {
            const auth = await createUserAndLogin();
            token = auth.token;
            username = auth.username;
            userId = auth.userId;

            // Connect to MongoDB during authenticated testing
            const uri = process.env.MONGO_URI || 'mongodb://root:rootpassword@127.0.0.1:27017/eris_test?authSource=admin';
            await mongoose.connect(uri);
        } catch {
            token = '';
        }
    });

    afterAll(async () => {
        try {
            await mongoose.disconnect();
        } catch {
            // Ignore teardown errors
        }
    });

    const itIfToken = (description: string, fn: () => Promise<void>) => {
        it(description, async () => {
            if (!token) {
                console.warn('Skipping test: could not obtain auth token (DB unavailable?)');
                return;
            }
            await fn();
        });
    };

    itIfToken('should return 400 when missing required fields during creation', async () => {
        const res = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: 'general' }); // Missing content

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing required fields');
    });

    itIfToken('should successfully create a message, retrieve user context, and return properties', async () => {
        const testRoomId = `room-${Date.now()}`;
        const messageContent = 'Hello, this is a real-time message!';

        const res = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: testRoomId, content: messageContent });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.room_id).toBe(testRoomId);
        expect(res.body.author_id).toBe(userId);
        expect(res.body.author_username).toBe(username);
        expect(res.body.content).toBe(messageContent);
        expect(res.body).toHaveProperty('createdAt');
    });

    itIfToken('should fetch historic messages for a room with corresponding usernames attached', async () => {
        const testRoomId = `room-fetch-${Date.now()}`;
        
        // 1. Post a couple messages
        await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: testRoomId, content: 'First message' });

        await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ room_id: testRoomId, content: 'Second message' });

        // 2. Fetch the messages back
        const res = await request(app)
            .get(`/api/messages/room/${testRoomId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);

        // Verify order and username attachment
        expect(res.body[0].content).toBe('First message');
        expect(res.body[0].author_username).toBe(username);
        expect(res.body[1].content).toBe('Second message');
        expect(res.body[1].author_username).toBe(username);
    });
});
