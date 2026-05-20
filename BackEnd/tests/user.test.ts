import prisma from '../src/config/prisma';
import { UserService } from '../src/services/user.service';
import { UserModel } from '../src/models/user.model';
import { randomUUID } from 'crypto';

describe('UserService & Auto-Sync Integration Tests', () => {
    const uniqueSuffix = randomUUID().replace(/-/g, '').slice(0, 8);
    const testUsername = `sync_${uniqueSuffix}`;
    const testEmail = `sync_user_${uniqueSuffix}@eris.local`;
    const testPassword = 'ValidPassword123!';

    let pocketbaseId: string;

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        // Clean up created user in Postgres and PocketBase
        if (pocketbaseId) {
            try {
                const user = await prisma.user.findUnique({
                    where: { pocketbaseId },
                    select: { id: true },
                });

                if (user) {
                    await prisma.$transaction([
                        prisma.userAlias.deleteMany({ where: { userId: user.id } }),
                        prisma.roomParticipant.deleteMany({ where: { userId: user.id } }),
                        prisma.userPerServer.deleteMany({ where: { userId: user.id } }),
                        prisma.serverInvite.deleteMany({ where: { creatorId: user.id } }),
                        prisma.room.deleteMany({ where: { server: { ownerId: user.id } } }),
                        prisma.server.deleteMany({ where: { ownerId: user.id } }),
                        prisma.user.delete({ where: { id: user.id } }),
                    ]);
                }

                await UserModel.deleteInPocketBaseById(pocketbaseId);
            } catch (err) {}
        }
        await prisma.$disconnect();
    });

    it('should successfully register a user in both PocketBase and Postgres', async () => {
        const result = await UserService.createUser({
            username: testUsername,
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword,
        });

        expect(result).toBeDefined();
        expect(result.username).toBe(testUsername);
        expect(result.pocketbaseId).toBeDefined();
        pocketbaseId = result.pocketbaseId!;

        // Verify it exists in Postgres
        const pgUser = await prisma.user.findUnique({
            where: { pocketbaseId }
        });
        expect(pgUser).toBeDefined();
        expect(pgUser?.username).toBe(testUsername);
    });

    it('should successfully login a user and return the Postgres record', async () => {
        const loginResult = await UserService.loginUser({
            email: testEmail,
            password: testPassword,
        });

        expect(loginResult).toBeDefined();
        expect(loginResult.token).toBeDefined();
        expect(loginResult.user.id).toBeDefined();
        // Since the user exists in Postgres, the returned id should be the Postgres UUID
        expect(loginResult.user.id).not.toBe(pocketbaseId);
    });

    it('should auto-sync the user to Postgres if they exist in PocketBase but are deleted from Postgres', async () => {
        // 1. Delete user from Postgres only
        await prisma.user.deleteMany({
            where: { pocketbaseId }
        });

        // Verify they are gone from Postgres
        const pgUserBefore = await prisma.user.findUnique({
            where: { pocketbaseId }
        });
        expect(pgUserBefore).toBeNull();

        // 2. Perform login, which should trigger the auto-sync mechanism
        const loginResult = await UserService.loginUser({
            email: testEmail,
            password: testPassword,
        });

        expect(loginResult).toBeDefined();
        expect(loginResult.user.username).toBe(testUsername);

        // 3. Verify user has been successfully recreated in Postgres
        const pgUserAfter = await prisma.user.findUnique({
            where: { pocketbaseId }
        });
        expect(pgUserAfter).not.toBeNull();
        expect(pgUserAfter?.username).toBe(testUsername);
        expect(pgUserAfter?.pocketbaseId).toBe(pocketbaseId);
    });
});
