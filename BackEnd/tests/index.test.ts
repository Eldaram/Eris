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
});
