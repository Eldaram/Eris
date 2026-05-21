import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const { runPocketBaseMigrations } = await import('../src/config/pb_migrations');
    await runPocketBaseMigrations();
}

main().catch((error) => {
    console.error('[setup-pocketbase] Failed to initialize PocketBase:', error);
    process.exit(1);
});