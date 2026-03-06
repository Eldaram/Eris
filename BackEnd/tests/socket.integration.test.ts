import { Server as HTTPServer } from 'http';
import { createServer } from 'http';
import express from 'express';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { initializeSocket, closeSocket, getSocketIO } from '../src/config/socket';
import { ServerService } from '../src/services/server.service';
import prisma from '../src/config/prisma';
import { Notification } from '../src/types/notifications';

describe('Server Creation with Real-time Notifications (Integration)', () => {
    let httpServer: HTTPServer;
    let app: express.Application;
    let clientSocket: ClientSocket;
    const port = 3003;
    let testUserId: string;

    beforeAll(async () => {
        // Create a test user in the database
        const testUser = await prisma.user.create({
            data: {
                username: 'testuser-socket-integration',
                pocketbaseId: 'pb-test-socket-user-integ',
            },
        });
        testUserId = testUser.id;
    });

    beforeEach((done) => {
        app = express();
        app.use(express.json());
        httpServer = createServer(app);
        initializeSocket(httpServer);

        httpServer.listen(port, () => {
            done();
        });
    });

    afterEach(async () => {
        if (clientSocket) {
            clientSocket.disconnect();
        }
        await closeSocket();
        await new Promise<void>((resolve) => {
            httpServer.close(() => resolve());
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.userPerServer.deleteMany({
            where: { userId: testUserId },
        });
        await prisma.room.deleteMany({
            where: {
                server: {
                    ownerId: testUserId,
                },
            },
        });
        await prisma.server.deleteMany({
            where: { ownerId: testUserId },
        });
        await prisma.user.delete({
            where: { id: testUserId },
        });
        await prisma.$disconnect();
    });

    test('should emit notification when server is created via service', (done) => {
        const serverName = 'Integration Test Server';

        clientSocket = ioClient(`http://localhost:${port}`);

        clientSocket.on('notification', (notification: Notification) => {
            expect(notification.type).toBe('server:created');
            if (notification.type === 'server:created') {
                expect(notification.data.serverName).toBe(serverName);
                expect(notification.data.ownerId).toBe(testUserId);
                expect(notification.data.serverId).toBeDefined();
            }
            done();
        });

        clientSocket.on('connect', () => {
            // Join the client to the user's room
            const io = getSocketIO();
            const userRoom = `user:${testUserId}`;
            if (clientSocket.id) {
                const socket = io.sockets.sockets.get(clientSocket.id);
                if (socket) {
                    socket.join(userRoom);
                }
            }

            // Create a server using the service
            setTimeout(async () => {
                try {
                    await ServerService.createServer({
                        name: serverName,
                        ownerId: testUserId,
                    });
                } catch (error) {
                    done(error);
                }
            }, 100);
        });
    });

    test('should create server successfully even if socket disconnected', async () => {
        // Test that server creation succeeds even if the socket is disconnected
        // This ensures the notification failure doesn't break the core functionality
        
        clientSocket = ioClient(`http://localhost:${port}`);

        await new Promise<void>((resolve) => {
            clientSocket.on('connect', () => {
                // Disconnect immediately after connecting
                clientSocket.disconnect();
                resolve();
            });
        });

        // Wait a bit for disconnection
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create a server - should succeed even though socket is disconnected
        const result = await ServerService.createServer({
            name: 'Server With Disconnected Socket',
            ownerId: testUserId,
        });

        expect(result.id).toBeDefined();

        // Verify the server was created in the database
        const server = await prisma.server.findUnique({
            where: { id: result.id },
        });

        expect(server).toBeDefined();
        expect(server?.name).toBe('Server With Disconnected Socket');
        expect(server?.ownerId).toBe(testUserId);
    });

    test('should create server successfully even if notification fails', async () => {
        // Simulate a scenario where socket is not initialized
        // but server creation should still succeed
        
        await closeSocket();

        const result = await ServerService.createServer({
            name: 'Server Without Socket',
            ownerId: testUserId,
        });

        expect(result.id).toBeDefined();

        // Verify the server was created in the database
        const server = await prisma.server.findUnique({
            where: { id: result.id },
        });

        expect(server).toBeDefined();
        expect(server?.name).toBe('Server Without Socket');
        expect(server?.ownerId).toBe(testUserId);
    });
});
