import express from 'express';
import request from 'supertest';
import prisma from '../src/config/prisma';
import serverRoutes from '../src/routes/serverRoutes';
import { UserService } from '../src/services/user.service';

describe('Server Routes', () => {
    let app: express.Application;
    let testUserId: string;
    let otherUserId: string;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/servers', serverRoutes);

        const testUser = await prisma.user.create({ data: { username: 'route-test-user', pocketbaseId: 'pb-route-test-user' } });
        testUserId = testUser.id;

        const otherUser = await prisma.user.create({ data: { username: 'route-other-user', pocketbaseId: 'pb-route-other-user' } });
        otherUserId = otherUser.id;
    });

    afterAll(async () => {
        await prisma.room.deleteMany();
        await prisma.userPerServer.deleteMany();
        await prisma.server.deleteMany();
        await prisma.user.deleteMany({ where: { username: { in: ['route-test-user', 'route-other-user'] } } });
        await prisma.$disconnect();
    });

    beforeEach(() => {
        jest.spyOn(UserService, 'verifyAuthToken').mockImplementation(async (token: string) => {
            if (token === 'token-test-user') {
                const user = await prisma.user.findUnique({ where: { id: testUserId } });
                return { user, token } as any;
            }
            if (token === 'token-other-user') {
                const user = await prisma.user.findUnique({ where: { id: otherUserId } });
                return { user, token } as any;
            }
            throw new Error('Invalid token');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('POST /api/servers creates a server for authenticated user', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', 'Bearer token-test-user')
            .send({ name: 'Route Test Server' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();

        const server = await prisma.server.findUnique({ where: { id: res.body.id } });
        expect(server).toBeDefined();
        expect(server?.ownerId).toBe(testUserId);
    });

    test('GET /api/servers returns only user servers', async () => {
        // create server for testUser
        const s1 = await prisma.server.create({ data: { name: 'User Server 1', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: s1.id, userId: testUserId } });

        // create server for otherUser
        const s2 = await prisma.server.create({ data: { name: 'Other Server', ownerId: otherUserId } });
        await prisma.userPerServer.create({ data: { serverId: s2.id, userId: otherUserId } });

        const res = await request(app).get('/api/servers').set('Authorization', 'Bearer token-test-user');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.servers)).toBe(true);
        expect(res.body.servers.some((s: any) => s.id === s1.id)).toBe(true);
        expect(res.body.servers.some((s: any) => s.id === s2.id)).toBe(false);
    });

    test('GET /api/servers/:serverId/channels returns channels for member and denies non-members', async () => {
        const server = await prisma.server.create({ data: { name: 'Channels Server', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: testUserId } });

        const roomA = await prisma.room.create({ data: { name: 'alpha', serverId: server.id, isDm: false } });
        const roomB = await prisma.room.create({ data: { name: 'beta', serverId: server.id, isDm: false } });

        // member request
        const resMember = await request(app)
            .get(`/api/servers/${server.id}/channels`)
            .set('Authorization', 'Bearer token-test-user');

        expect(resMember.status).toBe(200);
        expect(Array.isArray(resMember.body.channels)).toBe(true);
        expect(resMember.body.channels.some((c: any) => c.id === roomA.id)).toBe(true);

        // non-member request
        const resNon = await request(app)
            .get(`/api/servers/${server.id}/channels`)
            .set('Authorization', 'Bearer token-other-user');

        expect(resNon.status).toBe(403);
    });
});
