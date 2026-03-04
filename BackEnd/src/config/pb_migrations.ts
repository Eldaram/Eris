import pb from './pocketbase';

export const runPocketBaseMigrations = async () => {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@eris.local';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin_password_123';

    try {
        // Authenticate as admin
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
        console.log('Successfully authenticated PocketBase admin.');

        // 1. Create Pocketbase_User collection if it doesn't exist
        try {
            await pb.collections.getOne('Pocketbase_User');
            console.log('Collection Pocketbase_User already exists.');
        } catch (err: any) {
            if (err.status === 404) {
                console.log('Creating Collection Pocketbase_User...');
                await pb.collections.create({
                    name: 'Pocketbase_User',
                    type: 'base',
                    fields: [
                        { name: 'username', type: 'text', required: true, min: 1, max: 255, pattern: '' },
                        { name: 'email', type: 'email', required: true },
                        { name: 'password_hash', type: 'text', required: true }
                        // avatar_file_id added later
                    ],
                });
            } else {
                throw err;
            }
        }

        // 2. Create Pocketbase_Files collection if it doesn't exist
        const userCollection = await pb.collections.getOne('Pocketbase_User');

        try {
            await pb.collections.getOne('Pocketbase_Files');
            console.log('Collection Pocketbase_Files already exists.');
        } catch (err: any) {
            if (err.status === 404) {
                console.log('Creating Collection Pocketbase_Files...');
                await pb.collections.create({
                    name: 'Pocketbase_Files',
                    type: 'base',
                    fields: [
                        { name: 'user_id', type: 'relation', required: true, collectionId: userCollection.id, cascadeDelete: true, minSelect: 1, maxSelect: 1 },
                        { name: 'file_name', type: 'text', required: true },
                        { name: 'file_url', type: 'url', required: true }
                    ],
                });

                const filesCollection = await pb.collections.getOne('Pocketbase_Files');

                // Update user collection to point to avatar_file_id
                await pb.collections.update(userCollection.id, {
                    fields: [
                        ...(userCollection.fields || []),
                        { name: 'avatar_file_id', type: 'relation', required: false, collectionId: filesCollection.id, cascadeDelete: false, minSelect: null, maxSelect: 1 }
                    ]
                });
            } else {
                throw err;
            }
        }

        console.log('PocketBase migrations completed.');
    } catch (error: any) {
        console.error('Error running PocketBase migrations:');
        console.dir(error.response?.data || error, { depth: null });
        // Do not exit process here as it might just be PB not ready yet, or we could exit based on requirements
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
};
