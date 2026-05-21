import express from 'express';
import request from 'supertest';
import prisma from '../src/config/prisma';
import serverRoutes from '../src/routes/serverRoutes';
import inviteRoutes from '../src/routes/inviteRoutes';
import { UserService } from '../src/services/user.service';

describe('Server Routes', () => {
    let app: express.Application;
    let testUserId: string;
    let otherUserId: string;
    let originalFrontendUrl: string | undefined;

    beforeAll(async () => {
        originalFrontendUrl = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'http://frontend.test';

        app = express();
        app.use(express.json());
        app.use('/api/servers', serverRoutes);
        app.use('/api/invites', inviteRoutes);

        const testUser = await prisma.user.create({ data: { username: 'route-test-user', pocketbaseId: 'pb-route-test-user' } });
        testUserId = testUser.id;

        const otherUser = await prisma.user.create({ data: { username: 'route-other-user', pocketbaseId: 'pb-route-other-user' } });
        otherUserId = otherUser.id;
    });

    afterAll(async () => {
        await prisma.serverInvite.deleteMany();
        await prisma.room.deleteMany();
        await prisma.userPerServer.deleteMany();
        await prisma.server.deleteMany();
        await prisma.user.deleteMany({ where: { username: { in: ['route-test-user', 'route-other-user'] } } });
        process.env.FRONTEND_URL = originalFrontendUrl;
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

    test('POST /api/servers/:serverId/invites creates an invite link for any member', async () => {
        const server = await prisma.server.create({ data: { name: 'Invite Server', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: otherUserId } });

        const before = Date.now();
        const res = await request(app)
            .post(`/api/servers/${server.id}/invites`)
            .set('Authorization', 'Bearer token-other-user');

        expect(res.status).toBe(201);
        expect(typeof res.body.inviteUrl).toBe('string');
        expect(res.body.inviteUrl.startsWith('http://frontend.test/invite/')).toBe(true);
        expect(typeof res.body.expiresAt).toBe('string');

        const expiresAt = new Date(res.body.expiresAt).getTime();
        expect(expiresAt).toBeGreaterThan(before + 24 * 60 * 60 * 1000 - 5000);
        expect(expiresAt).toBeLessThan(before + 24 * 60 * 60 * 1000 + 5000);
    });

    test('POST /api/servers/:serverId/invites denies users who are not server members', async () => {
        const server = await prisma.server.create({ data: { name: 'Invite Deny Server', ownerId: otherUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: otherUserId } });

        const res = await request(app)
            .post(`/api/servers/${server.id}/invites`)
            .set('Authorization', 'Bearer token-test-user');

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('ACCESS_DENIED');
    });

    test('POST /api/invites/:code/redeem adds a logged-in user once and no-ops on repeat', async () => {
        const server = await prisma.server.create({ data: { name: 'Redeem Server', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: testUserId } });

        const createRes = await request(app)
            .post(`/api/servers/${server.id}/invites`)
            .set('Authorization', 'Bearer token-test-user');

        const inviteToken = new URL(createRes.body.inviteUrl).pathname.split('/').pop();
        expect(inviteToken).toBeTruthy();

        const redeemRes = await request(app)
            .post(`/api/invites/${inviteToken}/redeem`)
            .set('Authorization', 'Bearer token-other-user');

        expect(redeemRes.status).toBe(200);
        expect(redeemRes.body.serverId).toBe(server.id);
        expect(redeemRes.body.joined).toBe(true);
        expect(redeemRes.body.alreadyMember).toBe(false);

        const membershipAfterFirstRedeem = await prisma.userPerServer.findFirst({
            where: { serverId: server.id, userId: otherUserId },
        });
        expect(membershipAfterFirstRedeem).toBeDefined();

        const redeemAgainRes = await request(app)
            .post(`/api/invites/${inviteToken}/redeem`)
            .set('Authorization', 'Bearer token-other-user');

        expect(redeemAgainRes.status).toBe(200);
        expect(redeemAgainRes.body.joined).toBe(false);
        expect(redeemAgainRes.body.alreadyMember).toBe(true);

        const memberships = await prisma.userPerServer.findMany({
            where: { serverId: server.id, userId: otherUserId },
        });
        expect(memberships).toHaveLength(1);
    });

    test('GET /api/invites/:code returns the server name and member status for confirmation', async () => {
        const server = await prisma.server.create({ data: { name: 'Preview Server', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: testUserId } });

        const createRes = await request(app)
            .post(`/api/servers/${server.id}/invites`)
            .set('Authorization', 'Bearer token-test-user');

        const inviteToken = new URL(createRes.body.inviteUrl).pathname.split('/').pop();
        expect(inviteToken).toBeTruthy();

        const previewBeforeJoin = await request(app)
            .get(`/api/invites/${inviteToken}`)
            .set('Authorization', 'Bearer token-other-user');

        expect(previewBeforeJoin.status).toBe(200);
        expect(previewBeforeJoin.body.serverName).toBe('Preview Server');
        expect(previewBeforeJoin.body.alreadyMember).toBe(false);

        await request(app)
            .post(`/api/invites/${inviteToken}/redeem`)
            .set('Authorization', 'Bearer token-other-user');

        const previewAfterJoin = await request(app)
            .get(`/api/invites/${inviteToken}`)
            .set('Authorization', 'Bearer token-other-user');

        expect(previewAfterJoin.status).toBe(200);
        expect(previewAfterJoin.body.serverName).toBe('Preview Server');
        expect(previewAfterJoin.body.alreadyMember).toBe(true);
    });

    test('POST /api/invites/:code/redeem rejects expired invites', async () => {
        const server = await prisma.server.create({ data: { name: 'Expired Invite Server', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: testUserId } });

        const expiredCode = `expired-${Date.now()}`;
        await prisma.serverInvite.create({
            data: {
                serverId: server.id,
                creatorId: testUserId,
                code: expiredCode,
                expiresAt: new Date(Date.now() - 60 * 60 * 1000),
            },
        });

        const res = await request(app)
            .post(`/api/invites/${expiredCode}/redeem`)
            .set('Authorization', 'Bearer token-other-user');

        expect(res.status).toBe(410);
        expect(res.body.code).toBe('INVITE_EXPIRED');
    });

    test('GET /api/invites/:code rejects expired invites', async () => {
        const server = await prisma.server.create({ data: { name: 'Expired Preview Server', ownerId: testUserId } });
        await prisma.userPerServer.create({ data: { serverId: server.id, userId: testUserId } });

        const expiredCode = `expired-preview-${Date.now()}`;
        await prisma.serverInvite.create({
            data: {
                serverId: server.id,
                creatorId: testUserId,
                code: expiredCode,
                expiresAt: new Date(Date.now() - 60 * 60 * 1000),
            },
        });

        const res = await request(app)
            .get(`/api/invites/${expiredCode}`)
            .set('Authorization', 'Bearer token-other-user');

        expect(res.status).toBe(410);
        expect(res.body.code).toBe('INVITE_EXPIRED');
    });
});
