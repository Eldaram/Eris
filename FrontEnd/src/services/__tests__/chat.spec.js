import { vi, describe, it, expect, beforeEach } from 'vitest'
import { chatService, chatState } from '../chat'
import { socketService } from '../socket'

// Mock socketService
vi.mock('../socket', () => {
    return {
        socketService: {
            connect: vi.fn(),
            disconnect: vi.fn(),
            joinRoom: vi.fn(),
            leaveRoom: vi.fn(),
            on: vi.fn(),
            off: vi.fn()
        }
    }
})

// Mock authService
vi.mock('../auth', () => {
    return {
        authService: {
            getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer test-token' }))
        },
        authState: {
            user: { id: 'u1', username: 'testuser' },
            token: 'test-token'
        }
    }
})

describe('chatService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset state
        chatState.currentRoomId = null
        chatState.currentRoom = null
        chatState.messages = []
        chatState.isLoading = false
        chatState.isLoadingMore = false
        chatState.error = null
        chatState.hasMoreMessages = false
        chatState.oldestMessageId = null
        chatState.shouldScrollToBottom = false
    })

    it('should initialize chat by connecting to socket only', () => {

        chatService.init()

        expect(socketService.connect).toHaveBeenCalled()
        expect(socketService.joinRoom).not.toHaveBeenCalled()
    })

    it('should change room, update socket subscription, and load the first page', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            })
        )

        await chatService.setRoom({ id: 'lobby', name: 'lobby' })

        expect(chatState.currentRoomId).toBe('lobby')
        expect(socketService.joinRoom).toHaveBeenCalledWith('room:lobby')
        expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/messages/room/lobby'), expect.any(Object))

        fetchSpy.mockRestore()
    })

    it('should fetch room messages and update chat state correctly', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 'msg-1', room_id: 'general', author_id: 'u3', author_username: 'another', content: 'test msg', createdAt: '2026-05-20T10:00:00Z' }
                ])
            })
        )

        const fetchPromise = chatService.fetchMessages('general', { reset: true })
        expect(chatState.isLoading).toBe(true)

        await fetchPromise
        
        expect(chatState.isLoading).toBe(false)
        expect(chatState.error).toBeNull()
        expect(chatState.messages.length).toBe(1)
        expect(chatState.messages[0].content).toBe('test msg')
        expect(chatState.messages[0].author_username).toBe('another')
                expect(chatState.shouldScrollToBottom).toBe(true)

        fetchSpy.mockRestore()
    })

    it('should set error on failed fetch', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => 
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Network Error' })
            })
        )

        await chatService.fetchMessages('general')

        expect(chatState.isLoading).toBe(false)
        expect(chatState.error).toBe('Network Error')
        expect(chatState.messages.length).toBe(0)

        fetchSpy.mockRestore()
    })

    it('should send message to active room, POST to API and optimistically append message', async () => {
        chatState.currentRoomId = 'general'
        chatState.currentRoom = { id: 'general', name: 'general' }

        const mockNewMessage = {
            id: 'new-msg-999',
            room_id: 'general',
            author_id: 'u1',
            author_username: 'testuser',
            content: 'Hello, testing!',
            createdAt: '2026-05-20T10:05:00Z'
        }

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockNewMessage)
            })
        )

        const result = await chatService.sendMessage('Hello, testing!')

        expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringContaining('/api/messages'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ room_id: 'general', content: 'Hello, testing!' })
            })
        )
        expect(result).toEqual(mockNewMessage)
        expect(chatState.messages.length).toBe(1)
        expect(chatState.messages[0].content).toBe('Hello, testing!')
        expect(chatState.messages[0].author_username).toBe('testuser')

        fetchSpy.mockRestore()
    })

    it('should refuse to send a message without a selected room', async () => {
        await expect(chatService.sendMessage('Hello, testing!')).rejects.toThrow('Please choose a room first')
    })
})
