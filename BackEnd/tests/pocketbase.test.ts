import pb from '../src/config/pocketbase';
import { runPocketBaseMigrations } from '../src/config/pb_migrations';

describe('PocketBase Connection & Collections', () => {

    // We expect the infrastructure (docker compose) to be running and migrations to have been applied by the backend or CI
    // We check that Pocketbase_User and Pocketbase_Files exist

    beforeAll(async () => {
        // Run migrations first to ensure schema exists
        await runPocketBaseMigrations();

        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@eris.local';
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin_password_123';
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    });

    it('should be authenticated as admin', () => {
        expect(pb.authStore.isValid).toBeTruthy();
        expect(pb.authStore.isSuperuser).toBeTruthy();
    });

    it('should have Pocketbase_User collection', async () => {
        const collection = await pb.collections.getOne('Pocketbase_User');
        expect(collection).toBeDefined();
        expect(collection.name).toBe('Pocketbase_User');
        expect(collection.type).toBe('base');
    });

    it('should have Pocketbase_Files collection', async () => {
        const collection = await pb.collections.getOne('Pocketbase_Files');
        expect(collection).toBeDefined();
        expect(collection.name).toBe('Pocketbase_Files');
        expect(collection.type).toBe('base');
    });

    it('should correctly configure the user_id relation in Pocketbase_Files', async () => {
        const collection = await pb.collections.getOne('Pocketbase_Files');
        const userIdField = collection.fields.find((f: any) => f.name === 'user_id');

        expect(userIdField).toBeDefined();
        expect(userIdField?.type).toBe('relation');
        expect(userIdField?.collectionId).toBeDefined();
    });
});
