/**
 * Types for real-time notifications sent via Socket.IO
 */

// Base notification interface
export interface BaseNotification {
    type: string;
    timestamp: number;
}

// Server-related notifications
export interface ServerCreatedNotification extends BaseNotification {
    type: 'server:created';
    data: {
        serverId: string;
        serverName: string;
        ownerId: string;
    };
}

export interface ServerUpdatedNotification extends BaseNotification {
    type: 'server:updated';
    data: {
        serverId: string;
        serverName?: string;
        ownerId?: string;
    };
}

export interface ServerDeletedNotification extends BaseNotification {
    type: 'server:deleted';
    data: {
        serverId: string;
    };
}

export interface UserJoinedServerNotification extends BaseNotification {
    type: 'server:user-joined';
    data: {
        serverId: string;
        userId: string;
    };
}

export interface UserLeftServerNotification extends BaseNotification {
    type: 'server:user-left';
    data: {
        serverId: string;
        userId: string;
    };
}

// Room-related notifications (for future use)
export interface RoomCreatedNotification extends BaseNotification {
    type: 'room:created';
    data: {
        roomId: string;
        roomName: string;
        serverId: string;
    };
}

export interface RoomUpdatedNotification extends BaseNotification {
    type: 'room:updated';
    data: {
        roomId: string;
        roomName?: string;
    };
}

export interface RoomDeletedNotification extends BaseNotification {
    type: 'room:deleted';
    data: {
        roomId: string;
        serverId: string;
    };
}

// Message-related notifications (for future use)
export interface MessageReceivedNotification extends BaseNotification {
    type: 'message:received';
    data: {
        messageId: string;
        roomId: string;
        senderId: string;
        content: string;
    };
}

// User status notifications (for future use)
export interface UserStatusChangedNotification extends BaseNotification {
    type: 'user:status-changed';
    data: {
        userId: string;
        status: 'online' | 'offline' | 'away' | 'busy';
    };
}

// Union type of all possible notifications
export type Notification =
    | ServerCreatedNotification
    | ServerUpdatedNotification
    | ServerDeletedNotification
    | UserJoinedServerNotification
    | UserLeftServerNotification
    | RoomCreatedNotification
    | RoomUpdatedNotification
    | RoomDeletedNotification
    | MessageReceivedNotification
    | UserStatusChangedNotification;

// Socket.IO event map for type-safe event emission
export interface ServerToClientEvents {
    notification: (notification: Notification) => void;
}

export interface ClientToServerEvents {
    // For future client-initiated events
    ping: () => void;
}

export interface InterServerEvents {
    // For future inter-server communication
}

export interface SocketData {
    userId?: string;
}
