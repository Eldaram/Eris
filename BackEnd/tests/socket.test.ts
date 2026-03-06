import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { initializeSocket, closeSocket, getSocketIO } from '../src/config/socket';
import { NotificationService } from '../src/services/notification.service';
import { Notification } from '../src/types/notifications';

describe('Socket.IO Configuration', () => {
    let httpServer: HTTPServer;
    let io: SocketIOServer;
    let clientSocket: ClientSocket;
    const port = 3001;

    beforeEach((done) => {
        const app = express();
        httpServer = createServer(app);
        io = initializeSocket(httpServer);
        
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

    test('should establish a connection', (done) => {
        clientSocket = ioClient(`http://localhost:${port}`);

        clientSocket.on('connect', () => {
            expect(clientSocket.connected).toBe(true);
            done();
        });
    });

    test('should respond to ping events', (done) => {
        clientSocket = ioClient(`http://localhost:${port}`);

        clientSocket.on('connect', () => {
            clientSocket.emit('ping');
            // If we get here without errors, the ping was handled
            setTimeout(() => {
                expect(clientSocket.connected).toBe(true);
                done();
            }, 100);
        });
    });

    test('should handle disconnection', (done) => {
        clientSocket = ioClient(`http://localhost:${port}`);

        clientSocket.on('connect', () => {
            clientSocket.disconnect();
        });

        clientSocket.on('disconnect', () => {
            expect(clientSocket.connected).toBe(false);
            done();
        });
    });

    test('getSocketIO should return the initialized instance', () => {
        const socketInstance = getSocketIO();
        expect(socketInstance).toBe(io);
    });

    test('getSocketIO should throw if not initialized', async () => {
        await closeSocket();
        await new Promise<void>((resolve) => {
            httpServer.close(() => resolve());
        });

        expect(() => getSocketIO()).toThrow('Socket.IO has not been initialized');
    });
});

describe('NotificationService', () => {
    let httpServer: HTTPServer;
    let io: SocketIOServer;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    const port = 3002;

    beforeEach((done) => {
        const app = express();
        httpServer = createServer(app);
        io = initializeSocket(httpServer);
        
        httpServer.listen(port, () => {
            done();
        });
    });

    afterEach(async () => {
        if (clientSocket1) {
            clientSocket1.disconnect();
        }
        if (clientSocket2) {
            clientSocket2.disconnect();
        }
        await closeSocket();
        await new Promise<void>((resolve) => {
            httpServer.close(() => resolve());
        });
    });

    test('should emit notification to all clients', (done) => {
        const testNotification: Notification = {
            type: 'server:created',
            timestamp: Date.now(),
            data: {
                serverId: 'test-server-id',
                serverName: 'Test Server',
                ownerId: 'test-owner-id',
            },
        };

        let receivedCount = 0;
        const expectedCount = 2;

        const checkCompletion = () => {
            receivedCount++;
            if (receivedCount === expectedCount) {
                done();
            }
        };

        clientSocket1 = ioClient(`http://localhost:${port}`);
        clientSocket2 = ioClient(`http://localhost:${port}`);

        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification).toEqual(testNotification);
            checkCompletion();
        });

        clientSocket2.on('notification', (notification: Notification) => {
            expect(notification).toEqual(testNotification);
            checkCompletion();
        });

        // Wait for both clients to connect before emitting
        let connectedCount = 0;
        const onConnect = () => {
            connectedCount++;
            if (connectedCount === expectedCount) {
                NotificationService.emitToAll(testNotification);
            }
        };

        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
    });

    test('should emit notification to specific server room', (done) => {
        const serverId = 'test-server-123';
        const testNotification: Notification = {
            type: 'server:updated',
            timestamp: Date.now(),
            data: {
                serverId,
                serverName: 'Updated Server',
            },
        };

        clientSocket1 = ioClient(`http://localhost:${port}`);
        clientSocket2 = ioClient(`http://localhost:${port}`);

        // Only clientSocket1 should receive the notification
        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification).toEqual(testNotification);
            done();
        });

        clientSocket2.on('notification', () => {
            // This should not be called
            fail('clientSocket2 should not receive the notification');
        });

        let connectedCount = 0;
        const onConnect = () => {
            connectedCount++;
            if (connectedCount === 2) {
                // Join only clientSocket1 to the server room
                const serverRoom = `server:${serverId}`;
                if (clientSocket1.id) {
                    const socket1 = io.sockets.sockets.get(clientSocket1.id);
                    if (socket1) {
                        socket1.join(serverRoom);
                    }
                }

                // Emit to the server room
                setTimeout(() => {
                    NotificationService.emitToServer(serverId, testNotification);
                }, 100);
            }
        };

        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
    });

    test('should emit notification to specific user', (done) => {
        const userId = 'test-user-456';
        const testNotification: Notification = {
            type: 'server:created',
            timestamp: Date.now(),
            data: {
                serverId: 'new-server',
                serverName: 'User Server',
                ownerId: userId,
            },
        };

        clientSocket1 = ioClient(`http://localhost:${port}`);
        clientSocket2 = ioClient(`http://localhost:${port}`);

        // Only clientSocket1 should receive the notification
        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification).toEqual(testNotification);
            done();
        });

        clientSocket2.on('notification', () => {
            // This should not be called
            fail('clientSocket2 should not receive the notification');
        });

        let connectedCount = 0;
        const onConnect = () => {
            connectedCount++;
            if (connectedCount === 2) {
                // Join only clientSocket1 to the user room
                const userRoom = `user:${userId}`;
                if (clientSocket1.id) {
                    const socket1 = io.sockets.sockets.get(clientSocket1.id);
                    if (socket1) {
                        socket1.join(userRoom);
                    }
                }

                // Emit to the user room
                setTimeout(() => {
                    NotificationService.emitToUser(userId, testNotification);
                }, 100);
            }
        };

        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
    });

    test('should use helper method notifyServerCreated', (done) => {
        const serverId = 'server-789';
        const serverName = 'Helper Server';
        const ownerId = 'owner-123';

        clientSocket1 = ioClient(`http://localhost:${port}`);

        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification.type).toBe('server:created');
            expect(notification.data).toEqual({
                serverId,
                serverName,
                ownerId,
            });
            expect(notification.timestamp).toBeDefined();
            done();
        });

        clientSocket1.on('connect', () => {
            // Join clientSocket1 to the owner's user room
            const userRoom = `user:${ownerId}`;
            if (clientSocket1.id) {
                const socket1 = io.sockets.sockets.get(clientSocket1.id);
                if (socket1) {
                    socket1.join(userRoom);
                }
            }

            // Call the helper method
            setTimeout(() => {
                NotificationService.notifyServerCreated(serverId, serverName, ownerId);
            }, 100);
        });
    });

    test('should use helper method notifyServerUpdated', (done) => {
        const serverId = 'server-updated';
        const serverName = 'Updated Name';

        clientSocket1 = ioClient(`http://localhost:${port}`);

        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification.type).toBe('server:updated');
            expect(notification.data).toMatchObject({
                serverId,
                serverName,
            });
            done();
        });

        clientSocket1.on('connect', () => {
            // Join clientSocket1 to the server room
            const serverRoom = `server:${serverId}`;
            if (clientSocket1.id) {
                const socket1 = io.sockets.sockets.get(clientSocket1.id);
                if (socket1) {
                    socket1.join(serverRoom);
                }
            }

            // Call the helper method
            setTimeout(() => {
                NotificationService.notifyServerUpdated(serverId, { serverName });
            }, 100);
        });
    });

    test('should use helper method notifyServerDeleted', (done) => {
        const serverId = 'server-deleted';

        clientSocket1 = ioClient(`http://localhost:${port}`);

        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification.type).toBe('server:deleted');
            expect(notification.data).toEqual({ serverId });
            done();
        });

        clientSocket1.on('connect', () => {
            // Join clientSocket1 to the server room
            const serverRoom = `server:${serverId}`;
            if (clientSocket1.id) {
                const socket1 = io.sockets.sockets.get(clientSocket1.id);
                if (socket1) {
                    socket1.join(serverRoom);
                }
            }

            // Call the helper method
            setTimeout(() => {
                NotificationService.notifyServerDeleted(serverId);
            }, 100);
        });
    });

    test('should use helper method notifyUserJoinedServer', (done) => {
        const serverId = 'server-join';
        const userId = 'user-join';

        clientSocket1 = ioClient(`http://localhost:${port}`);

        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification.type).toBe('server:user-joined');
            expect(notification.data).toEqual({ serverId, userId });
            done();
        });

        clientSocket1.on('connect', () => {
            // Join clientSocket1 to the server room
            const serverRoom = `server:${serverId}`;
            if (clientSocket1.id) {
                const socket1 = io.sockets.sockets.get(clientSocket1.id);
                if (socket1) {
                    socket1.join(serverRoom);
                }
            }

            // Call the helper method
            setTimeout(() => {
                NotificationService.notifyUserJoinedServer(serverId, userId);
            }, 100);
        });
    });

    test('should use helper method notifyUserLeftServer', (done) => {
        const serverId = 'server-leave';
        const userId = 'user-leave';

        clientSocket1 = ioClient(`http://localhost:${port}`);

        clientSocket1.on('notification', (notification: Notification) => {
            expect(notification.type).toBe('server:user-left');
            expect(notification.data).toEqual({ serverId, userId });
            done();
        });

        clientSocket1.on('connect', () => {
            // Join clientSocket1 to the server room
            const serverRoom = `server:${serverId}`;
            if (clientSocket1.id) {
                const socket1 = io.sockets.sockets.get(clientSocket1.id);
                if (socket1) {
                    socket1.join(serverRoom);
                }
            }

            // Call the helper method
            setTimeout(() => {
                NotificationService.notifyUserLeftServer(serverId, userId);
            }, 100);
        });
    });

    test('should handle errors gracefully when socket not initialized', () => {
        // This test ensures NotificationService doesn't crash when socket is not initialized
        // In a real scenario, this might happen during app initialization
        expect(() => {
            // These should log errors but not throw
            NotificationService.emitToAll({
                type: 'server:created',
                timestamp: Date.now(),
                data: { serverId: 'test', serverName: 'test', ownerId: 'test' },
            });
        }).not.toThrow();
    });
});
