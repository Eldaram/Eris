import { getSocketIO } from '../config/socket';
import { Notification } from '../types/notifications';

/**
 * NotificationService handles the emission of real-time notifications to clients.
 * It provides methods to broadcast notifications to all clients or specific rooms.
 */
export class NotificationService {
    /**
     * Emit a notification to all connected clients
     * @param notification - The notification to emit
     */
    static emitToAll(notification: Notification): void {
        try {
            const io = getSocketIO();
            io.emit('notification', notification);
            console.log(`[NotificationService] Emitted to all: ${notification.type}`);
        } catch (error) {
            console.error('[NotificationService] Failed to emit notification:', error);
        }
    }

    /**
     * Emit a notification to all users in a specific server
     * @param serverId - The server ID to emit to
     * @param notification - The notification to emit
     */
    static emitToServer(serverId: string, notification: Notification): void {
        try {
            const io = getSocketIO();
            io.to(`server:${serverId}`).emit('notification', notification);
            console.log(`[NotificationService] Emitted to server ${serverId}: ${notification.type}`);
        } catch (error) {
            console.error('[NotificationService] Failed to emit notification:', error);
        }
    }

    /**
     * Emit a notification to all users in a specific room
     * @param roomId - The room ID to emit to
     * @param notification - The notification to emit
     */
    static emitToRoom(roomId: string, notification: Notification): void {
        try {
            const io = getSocketIO();
            io.to(`room:${roomId}`).emit('notification', notification);
            console.log(`[NotificationService] Emitted to room ${roomId}: ${notification.type}`);
        } catch (error) {
            console.error('[NotificationService] Failed to emit notification:', error);
        }
    }

    /**
     * Emit a notification to a specific user
     * @param userId - The user ID to emit to
     * @param notification - The notification to emit
     */
    static emitToUser(userId: string, notification: Notification): void {
        try {
            const io = getSocketIO();
            io.to(`user:${userId}`).emit('notification', notification);
            console.log(`[NotificationService] Emitted to user ${userId}: ${notification.type}`);
        } catch (error) {
            console.error('[NotificationService] Failed to emit notification:', error);
        }
    }

    /**
     * Helper method to create a server created notification and emit it
     */
    static notifyServerCreated(serverId: string, serverName: string, ownerId: string): void {
        const notification: Notification = {
            type: 'server:created',
            timestamp: Date.now(),
            data: {
                serverId,
                serverName,
                ownerId,
            },
        };
        
        // Emit to the owner
        this.emitToUser(ownerId, notification);
    }

    /**
     * Helper method to create a server updated notification and emit it
     */
    static notifyServerUpdated(
        serverId: string,
        updates: { serverName?: string; ownerId?: string }
    ): void {
        const notification: Notification = {
            type: 'server:updated',
            timestamp: Date.now(),
            data: {
                serverId,
                ...updates,
            },
        };
        
        // Emit to all users in the server
        this.emitToServer(serverId, notification);
    }

    /**
     * Helper method to create a server deleted notification and emit it
     */
    static notifyServerDeleted(serverId: string): void {
        const notification: Notification = {
            type: 'server:deleted',
            timestamp: Date.now(),
            data: {
                serverId,
            },
        };
        
        // Emit to all users in the server
        this.emitToServer(serverId, notification);
    }

    /**
     * Helper method to create a user joined server notification and emit it
     */
    static notifyUserJoinedServer(serverId: string, userId: string): void {
        const notification: Notification = {
            type: 'server:user-joined',
            timestamp: Date.now(),
            data: {
                serverId,
                userId,
            },
        };
        
        // Emit to all users in the server
        this.emitToServer(serverId, notification);
    }

    /**
     * Helper method to create a user left server notification and emit it
     */
    static notifyUserLeftServer(serverId: string, userId: string): void {
        const notification: Notification = {
            type: 'server:user-left',
            timestamp: Date.now(),
            data: {
                serverId,
                userId,
            },
        };
        
        // Emit to all users in the server
        this.emitToServer(serverId, notification);
    }
}
