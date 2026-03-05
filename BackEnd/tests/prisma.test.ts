import prisma from '../src/config/prisma';
import { UserModel } from '../src/models/user.model';

describe('Prisma Schema Verification', () => {
    beforeAll(async () => {
        // Clean up or ensure connection
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should be able to create and find a user', async () => {
        const testUsername = `testuser_${Date.now()}`;
        const pocketbaseId = `pb_${Date.now()}`;
        const newUser = await UserModel.createInPrisma(testUsername, pocketbaseId);

        expect(newUser).toBeDefined();
        expect(newUser.username).toBe(testUsername);

        const foundUser = await UserModel.findById(newUser.id);
        expect(foundUser).toBeDefined();
        expect(foundUser?.username).toBe(testUsername);
    });

    it('should verify other tables exist (via basic count)', async () => {
        // These should not throw if tables exist
        await expect(prisma.server.count()).resolves.toBeDefined();
        await expect(prisma.userAlias.count()).resolves.toBeDefined();
        await expect(prisma.userPerServer.count()).resolves.toBeDefined();
        await expect(prisma.serverInvite.count()).resolves.toBeDefined();
        await expect(prisma.room.count()).resolves.toBeDefined();
        await expect(prisma.roomParticipant.count()).resolves.toBeDefined();
    });
});
