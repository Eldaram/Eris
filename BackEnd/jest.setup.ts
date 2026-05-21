import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Start a lightweight HTTP + Socket.IO server for tests so NotificationService
// can emit to a real Socket.IO instance during CI and local test runs.
import { createServer } from 'http';
import { initializeSocket, closeSocket } from './src/config/socket';

const testServer = createServer();
try {
	initializeSocket(testServer);
	// Listen on an ephemeral port to avoid conflicts
	testServer.listen(0, () => {
		const addr: any = testServer.address();
		console.log(`[jest.setup] Test Socket.IO server listening on port ${addr?.port}`);
	});
} catch (err) {
	console.error('[jest.setup] Failed to initialize test Socket.IO server:', err);
}

// Ensure we close socket on process exit
process.on('exit', async () => {
	try {
		await closeSocket();
	} catch (e) {}
	try {
		testServer.close();
	} catch (e) {}
});

