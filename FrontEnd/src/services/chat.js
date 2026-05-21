import { reactive, watch } from 'vue';
import { authService } from './auth';
import { socketService } from './socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const PAGE_SIZE = 25;

export const chatState = reactive({
    currentRoomId: null,
    currentRoom: null,
    messages: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMoreMessages: false,
    oldestMessageId: null,
    shouldScrollToBottom: false,
});

watch(() => chatState.currentRoomId, (newRoomId, oldRoomId) => {
    if (oldRoomId) {
        socketService.leaveRoom(`room:${oldRoomId}`);
    }

    if (newRoomId) {
        socketService.joinRoom(`room:${newRoomId}`);
    }
});

const normalizeMessage = (msg) => ({
    id: msg.id || msg._id,
    _id: msg.id || msg._id,
    room_id: msg.room_id,
    author_id: msg.author_id,
    author_username: msg.author_username || 'User',
    content: msg.content,
    createdAt: msg.createdAt || msg.created_at,
});

socketService.on('message:received', (data) => {
    if (data.roomId !== chatState.currentRoomId) {
        return;
    }

    const exists = chatState.messages.some((msg) => msg.id === data.messageId || msg._id === data.messageId);
    if (exists) {
        return;
    }

    chatState.messages.push({
        id: data.messageId,
        _id: data.messageId,
        room_id: data.roomId,
        author_id: data.senderId,
        author_username: data.senderUsername || 'User',
        content: data.content,
        createdAt: new Date().toISOString(),
    });

    chatState.oldestMessageId = chatState.messages[0]?.id || null;
});

export const chatService = {
    init() {
        socketService.connect();
    },

    setRoom(room) {
        if (!room) {
            this.clearRoom();
            return;
        }

        const nextRoom = typeof room === 'string'
            ? { id: room, name: room }
            : room;

        if (chatState.currentRoomId === nextRoom.id) {
            return;
        }

        chatState.currentRoomId = nextRoom.id;
        chatState.currentRoom = nextRoom;
        chatState.messages = [];
        chatState.isLoading = false;
        chatState.isLoadingMore = false;
        chatState.error = null;
        chatState.hasMoreMessages = false;
        chatState.oldestMessageId = null;
        chatState.shouldScrollToBottom = false;

        return this.fetchMessages(nextRoom.id, { reset: true });
    },

    clearRoom() {
        chatState.currentRoomId = null;
        chatState.currentRoom = null;
        chatState.messages = [];
        chatState.isLoading = false;
        chatState.isLoadingMore = false;
        chatState.error = null;
        chatState.hasMoreMessages = false;
        chatState.oldestMessageId = null;
        chatState.shouldScrollToBottom = false;
    },

    async fetchMessages(roomId, options = {}) {
        const { beforeMessageId = null, reset = false } = options;

        if (!roomId) {
            return [];
        }

        if (reset) {
            chatState.isLoading = true;
        } else {
            chatState.isLoadingMore = true;
        }
        chatState.error = null;

        try {
            const url = new URL(`${API_URL}/api/messages/room/${roomId}`);
            if (beforeMessageId) {
                url.searchParams.set('beforeMessageId', beforeMessageId);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    ...authService.getAuthHeader(),
                },
            });

            if (response.status === 401) {
                authService.logout();
                return [];
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch messages');
            }

            const normalizedMessages = data.map(normalizeMessage);

            if (beforeMessageId) {
                chatState.messages = [...normalizedMessages, ...chatState.messages];
            } else {
                chatState.messages = normalizedMessages;
            }

            chatState.oldestMessageId = chatState.messages[0]?.id || null;
            chatState.hasMoreMessages = normalizedMessages.length === PAGE_SIZE;

            if (!beforeMessageId) {
                chatState.shouldScrollToBottom = true;
            }

            return normalizedMessages;
        } catch (error) {
            console.error('[ChatService] Fetch messages error:', error);
            chatState.error = error?.message || 'Failed to fetch messages';
            return [];
        } finally {
            chatState.isLoading = false;
            chatState.isLoadingMore = false;
        }
    },

    async loadOlderMessages() {
        if (!chatState.currentRoomId || !chatState.hasMoreMessages || !chatState.oldestMessageId || chatState.isLoadingMore) {
            return [];
        }

        return this.fetchMessages(chatState.currentRoomId, {
            beforeMessageId: chatState.oldestMessageId,
        });
    },

    async sendMessage(content) {
        if (!content || !content.trim()) return;

        const roomId = chatState.currentRoomId;
        if (!roomId) {
            throw new Error('Please choose a room first');
        }

        try {
            const response = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader(),
                },
                body: JSON.stringify({
                    room_id: roomId,
                    content: content.trim(),
                }),
            });

            if (response.status === 401) {
                authService.logout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            const exists = chatState.messages.some((msg) => msg.id === data.id || msg.id === data._id);
            if (!exists) {
                chatState.messages.push(normalizeMessage(data));
            }

            chatState.oldestMessageId = chatState.messages[0]?.id || null;
            chatState.shouldScrollToBottom = true;

            return data;
        } catch (error) {
            console.error('[ChatService] Send message error:', error);
            throw error;
        }
    },
};
