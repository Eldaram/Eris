import request from 'supertest';
import app from '../src/index';

describe('API Health Check', () => {
    it('GET /api/health should return ok status', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'ok',
            message: 'Eris API is running'
        });
    });

    it('POST /api/users should return invalid email error', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                username: 'valid_user',
                email: 'not-an-email',
                password: 'password123',
                confirmPassword: 'password123',
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_EMAIL');
    });

    it('POST /api/users should return password mismatch error', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                username: 'valid_user',
                email: 'valid@example.com',
                password: 'password123',
                confirmPassword: 'password124',
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('PASSWORD_MISMATCH');
    });

    it('POST /api/users/login should return error for missing credentials', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                password: 'password123',
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_PASSWORD');
    });

    it('POST /api/users/login should return invalid credentials error', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'wrong@example.com',
                password: 'wrongpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe('INVALID_PASSWORD');
    });

    it('POST /api/users/login should successfully login a created user', async () => {
        const uniqueSuffix = Date.now().toString();
        const testUser = {
            username: `testuser_${uniqueSuffix}`,
            email: `test_login_${uniqueSuffix}@example.com`,
            password: 'ValidPassword123!',
            confirmPassword: 'ValidPassword123!',
        };

        // 1. Create the user
        const createRes = await request(app)
            .post('/api/users')
            .send(testUser);

        expect(createRes.status).toBe(201);
        expect(createRes.body).toHaveProperty('id');
        expect(createRes.body.username).toBe(testUser.username);

        // 2. Login with the user
        const loginRes = await request(app)
            .post('/api/users/login')
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty('token');
        expect(loginRes.body).toHaveProperty('user');
        expect(loginRes.body.user.username).toBe(testUser.username);
    });
});
