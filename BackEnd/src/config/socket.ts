import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../types/notifications';
import { isAllowedOrigin } from './cors';

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
    io = new SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (isAllowedOrigin(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error('Not allowed by Socket.IO CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Connection handler
    io.on('connection', (socket: any) => {
        console.log(`Client connected: ${socket.id}`);
        const s = socket as any;

        // Handle ping event
        s.on('ping', () => {
            console.log(`Ping received from ${socket.id}`);
        });

        // Handle joining rooms
        s.on('join', (data: { room: string }) => {
            if (data?.room) {
                s.join(data.room);
                console.log(`[Socket] Client ${socket.id} joined room: ${data.room}`);
            }
        });

        // Handle leaving rooms
        s.on('leave', (data: { room: string }) => {
            if (data?.room) {
                s.leave(data.room);
                console.log(`[Socket] Client ${socket.id} left room: ${data.room}`);
            }
        });

        // Handle disconnection
        s.on('disconnect', (reason: any) => {
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
