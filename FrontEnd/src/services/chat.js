import { reactive, watch } from 'vue';
import { authService } from './auth';
import { socketService } from './socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const chatState = reactive({
    currentRoomId: 'general', // Default hardcoded room for Eris
    messages: [],
    isLoading: false,
    error: null
});

// Watch the current room and manage socket room joining/leaving
watch(() => chatState.currentRoomId, (newRoomId, oldRoomId) => {
    if (oldRoomId) {
        socketService.leaveRoom(`room:${oldRoomId}`);
    }
    if (newRoomId) {
        socketService.joinRoom(`room:${newRoomId}`);
        chatService.fetchMessages(newRoomId);
    }
});

// Listen to message notifications in real-time
socketService.on('message:received', (data) => {
    // Only append if it's for the currently active room
    if (data.roomId === chatState.currentRoomId) {
        // Prevent duplicate messages if the sender already appended it locally
        const exists = chatState.messages.some(msg => msg.id === data.messageId || msg._id === data.messageId);
        if (!exists) {
            chatState.messages.push({
                id: data.messageId,
                _id: data.messageId,
                room_id: data.roomId,
                author_id: data.senderId,
                author_username: data.senderUsername || 'User',
                content: data.content,
                createdAt: new Date().toISOString()
            });
        }
    }
});

export const chatService = {
    /**
     * Initialize the chat system (connect socket and load messages)
     */
    init() {
        socketService.connect();
        if (chatState.currentRoomId) {
            socketService.joinRoom(`room:${chatState.currentRoomId}`);
            this.fetchMessages(chatState.currentRoomId);
        }
    },

    /**
     * Change active room
     * @param {string} roomId
     */
    setRoom(roomId) {
        chatState.currentRoomId = roomId;
    },

    /**
     * Fetch historic messages for the specified room
     * @param {string} roomId
     */
    async fetchMessages(roomId) {
        chatState.isLoading = true;
        chatState.error = null;

        try {
            const response = await fetch(`${API_URL}/api/messages/room/${roomId}`, {
                method: 'GET',
                headers: {
                    ...authService.getAuthHeader()
                }
            });

            if (response.status === 401) {
                authService.logout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch messages');
            }

            chatState.messages = data.map(msg => ({
                id: msg.id || msg._id,
                _id: msg.id || msg._id,
                room_id: msg.room_id,
                author_id: msg.author_id,
                author_username: msg.author_username || 'User',
                content: msg.content,
                createdAt: msg.createdAt || msg.created_at
            }));
        } catch (error) {
            console.error('[ChatService] Fetch messages error:', error);
            chatState.error = error.message;
        } finally {
            chatState.isLoading = false;
        }
    },

    /**
     * Send a message to the active room
     * @param {string} content - Message content
     */
    async sendMessage(content) {
        if (!content || !content.trim()) return;

        const roomId = chatState.currentRoomId;

        try {
            const response = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                },
                body: JSON.stringify({
                    room_id: roomId,
                    content: content.trim()
                })
            });

            if (response.status === 401) {
                authService.logout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            // Optimistically add message or replace existing placeholder
            const exists = chatState.messages.some(msg => msg.id === data._id || msg.id === data.id);
            if (!exists) {
                chatState.messages.push({
                    id: data.id || data._id,
                    _id: data.id || data._id,
                    room_id: data.room_id,
                    author_id: data.author_id,
                    author_username: data.author_username || 'User',
                    content: data.content,
                    createdAt: data.createdAt
                });
            }

            return data;
        } catch (error) {
            console.error('[ChatService] Send message error:', error);
            throw error;
        }
    }
};
