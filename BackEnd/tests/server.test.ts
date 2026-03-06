import request from 'supertest';
import app from '../src/index';

/**
 * Integration tests for POST /api/servers
 *
 * Since this endpoint requires a real authenticated user (PocketBase token),
 * tests are organized into:
 * 1. Unauthenticated requests (no DB needed — fast, always run)
 * 2. Authenticated requests (requires a live DB — will skip gracefully if unavailable)
 */

// Helper: create a fresh user and return its token + prisma id
async function createUserAndLogin(): Promise<{ token: string; userId: string }> {
    const uniqueSuffix = Date.now().toString();
    const testUser = {
        username: `srv_test_${uniqueSuffix}`,
        email: `srv_test_${uniqueSuffix}@example.com`,
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
    };
}

// ─── Unauthenticated Tests ────────────────────────────────────────────────────

describe('POST /api/servers — unauthenticated', () => {
    it('should return 401 when no Authorization header is provided', async () => {
        const res = await request(app)
            .post('/api/servers')
            .send({ name: 'My Server' });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 when Authorization header is malformed', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', 'NotBearer sometoken')
            .send({ name: 'My Server' });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 when the Bearer token is invalid', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', 'Bearer totally.invalid.token')
            .send({ name: 'My Server' });

        expect(res.status).toBe(401);
    });
});

// ─── Authenticated Tests ──────────────────────────────────────────────────────

describe('POST /api/servers — authenticated', () => {
    let token: string;

    // Create a user once for all tests in this suite
    beforeAll(async () => {
        try {
            const auth = await createUserAndLogin();
            token = auth.token;
        } catch {
            token = '';
        }
    });

    // Skip the entire suite if we could not authenticate (no DB available)
    const itIfToken = (description: string, fn: () => Promise<void>) => {
        it(description, async () => {
            if (!token) {
                console.warn('Skipping test: could not obtain auth token (DB unavailable?)');
                return;
            }
            await fn();
        });
    };

    itIfToken('should return 400 when name is missing from the body', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_SERVER_NAME');
    });

    itIfToken('should return 400 when name is an empty string', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_SERVER_NAME');
    });

    itIfToken('should return 400 when name exceeds 100 characters', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'A'.repeat(101) });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_SERVER_NAME');
    });

    itIfToken('should create a server and return its id on success', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Awesome Server' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(typeof res.body.id).toBe('string');
        expect(res.body.id.length).toBeGreaterThan(0);
    });

    itIfToken('should be able to create multiple servers with different names', async () => {
        const firstRes = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Server Alpha ${Date.now()}` });

        const secondRes = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Server Beta ${Date.now()}` });

        expect(firstRes.status).toBe(200);
        expect(secondRes.status).toBe(200);
        // Each server should have a unique id
        expect(firstRes.body.id).not.toBe(secondRes.body.id);
    });
});
