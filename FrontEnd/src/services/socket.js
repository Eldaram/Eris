import { io } from 'socket.io-client';
import { authState } from './auth';
import { getApiBaseUrl } from './apiBase';

let socket = null;
const eventHandlers = new Map();
const joinedRooms = new Set();

export const socketService = {
    /**
     * Connect to the Socket.IO server using the stored auth token
     */
    connect() {
        if (socket) return socket;

        const serverUrl = getApiBaseUrl();
        
        socket = io(serverUrl, {
            auth: {
                token: authState.token
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log('[SocketService] Connected to server. ID:', socket.id);
            // Re-join existing rooms if reconnection occurred
            this.rejoinRooms();
        });

        socket.on('disconnect', (reason) => {
            console.log('[SocketService] Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('[SocketService] Connection error:', error.message);
        });

        // Listen for generic notification events and dispatch to registered handlers
        socket.on('notification', (notification) => {
            console.log('[SocketService] Received notification:', notification);
            const handlers = eventHandlers.get(notification.type) || [];
            handlers.forEach(handler => {
                try {
                    handler(notification.data, notification);
                } catch (err) {
                    console.error(`[SocketService] Error running handler for ${notification.type}:`, err);
                }
            });
        });

        return socket;
    },

    /**
     * Disconnect from the Socket.IO server
     */
    disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
            joinedRooms.clear();
            console.log('[SocketService] Manually disconnected');
        }
    },

    /**
     * Register a callback for a specific notification type
     * @param {string} type - The notification type (e.g. 'message:received')
     * @param {Function} callback - The handler function
     */
    on(type, callback) {
        if (!eventHandlers.has(type)) {
            eventHandlers.set(type, []);
        }
        eventHandlers.get(type).push(callback);
    },

    /**
     * Remove a callback for a specific notification type
     * @param {string} type - The notification type
     * @param {Function} callback - The handler function to remove
     */
    off(type, callback) {
        const handlers = eventHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(callback);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    },

    /**
     * Tell the socket to join a specific room
     * @param {string} roomName - The room identifier (e.g., 'room:general')
     */
    joinRoom(roomName) {
        joinedRooms.add(roomName);
        if (socket?.connected) {
            socket.emit('join', { room: roomName });
            console.log(`[SocketService] Request to join room: ${roomName}`);
        }
    },

    /**
     * Tell the socket to leave a specific room
     * @param {string} roomName - The room identifier
     */
    leaveRoom(roomName) {
        joinedRooms.delete(roomName);
        if (socket?.connected) {
            socket.emit('leave', { room: roomName });
            console.log(`[SocketService] Request to leave room: ${roomName}`);
        }
    },

    /**
     * Helper to re-join active rooms on reconnection
     */
    rejoinRooms() {
        if (!socket?.connected) return;

        joinedRooms.forEach((roomName) => {
            socket.emit('join', { room: roomName });
            console.log(`[SocketService] Re-joined room: ${roomName}`);
        });
    }
};
