import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../types/notifications';

let io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> | null = null;

/**
 * Initialize Socket.IO server
 * @param httpServer - The HTTP server to attach Socket.IO to
 * @returns The initialized Socket.IO server instance
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

    io = new SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(httpServer, {
        cors: {
            origin: allowedOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle ping event
        socket.on('ping', () => {
            console.log(`Ping received from ${socket.id}`);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        });
    });

    console.log('Socket.IO server initialized');
    return io;
}

/**
 * Get the Socket.IO server instance
 * Throws an error if the server hasn't been initialized
 */
export function getSocketIO(): SocketIOServer {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initializeSocket() first.');
    }
    return io;
}

/**
 * Close the Socket.IO server
 */
export function closeSocket(): Promise<void> {
    return new Promise((resolve) => {
        if (io) {
            io.close(() => {
                io = null;
                resolve();
            });
        } else {
            resolve();
        }
    });
}

export default { initializeSocket, getSocketIO, closeSocket };
