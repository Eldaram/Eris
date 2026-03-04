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
});
