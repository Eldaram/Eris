import pb from './pocketbase';

export const runPocketBaseMigrations = async () => {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@eris.local';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin_password_123';

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(adminEmail, adminPassword);
        console.log('Successfully authenticated PocketBase admin.');

        // Verify and configure the built-in 'users' auth collection
        try {
            const usersCollection = await pb.collections.getOne('users');
            console.log('PocketBase built-in users collection is ready.');
            console.log(`Collection type: ${usersCollection.type}`);

            // Check if username field exists, if not add it
            const hasUsernameField = usersCollection.fields?.some((f: any) => f.name === 'username');
            if (!hasUsernameField) {
                console.log('Adding username field to users collection...');
                usersCollection.fields = usersCollection.fields || [];
                usersCollection.fields.push({
                    id: `text_${Date.now()}`,
                    name: 'username',
                    type: 'text',
                    required: false,
                    hidden: false,
                    presentable: true,
                    unique: true,
                    system: false,
                } as any);
                await pb.collections.update(usersCollection.id, usersCollection);
                console.log('Username field added to users collection.');
            } else {
                console.log('Username field already exists in users collection.');
            }
        } catch (err: any) {
            if (err.status === 404) {
                console.warn('Built-in users collection not found. PocketBase should create this automatically.');
                console.warn('Make sure you are running PocketBase v0.8.0 or later.');
            } else {
                throw err;
            }
        }

        console.log('PocketBase initialization completed.');
    } catch (error: any) {
        console.error('Error initializing PocketBase:');
        console.dir(error.response?.data || error, { depth: null });
        // Do not exit process here as it might just be PB not ready yet
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
};
