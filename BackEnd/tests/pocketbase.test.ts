import pb from '../src/config/pocketbase';
import { runPocketBaseMigrations } from '../src/config/pb_migrations';

describe('PocketBase Connection & Authentication', () => {

    // We expect PocketBase to be running with its built-in users collection
    // This tests the standard PocketBase auth system

    beforeAll(async () => {
        // Run initialization to verify PocketBase is ready
        await runPocketBaseMigrations();

        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@eris.local';
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin_password_123';
        await pb.admins.authWithPassword(adminEmail, adminPassword);
    });

    it('should be authenticated as admin', () => {
        expect(pb.authStore.isValid).toBeTruthy();
        expect(pb.authStore.token).toBeTruthy();
    });

    it('should have built-in users auth collection', async () => {
        const collection = await pb.collections.getOne('users');
        expect(collection).toBeDefined();
        expect(collection.name).toBe('users');
        expect(collection.type).toBe('auth');
    });

    it('should have username and email fields in users collection', async () => {
        const collection = await pb.collections.getOne('users');
        
        const usernameField = collection.fields?.find((f: any) => f.name === 'username');
        const emailField = collection.fields?.find((f: any) => f.name === 'email');

        expect(usernameField).toBeDefined();
        expect(emailField).toBeDefined();
        expect(emailField?.type).toBe('email');
        expect(usernameField?.type).toBe('text');
    });
});
