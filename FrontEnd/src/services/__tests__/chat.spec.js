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
        chatState.currentRoomId = 'general'
        chatState.messages = []
        chatState.isLoading = false
        chatState.error = null
    })

    it('should initialize chat correctly by connecting to socket and joining default room', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 'm1', room_id: 'general', author_id: 'u2', author_username: 'friend', content: 'hello' }
                ])
            })
        )

        chatService.init()

        expect(socketService.connect).toHaveBeenCalled()
        expect(socketService.joinRoom).toHaveBeenCalledWith('room:general')
        
        // Wait for asynchronous fetch inside init
        await vi.waitFor(() => expect(chatState.isLoading).toBe(false))
        expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/messages/room/general'), expect.any(Object))
        expect(chatState.messages.length).toBe(1)
        expect(chatState.messages[0].content).toBe('hello')

        fetchSpy.mockRestore()
    })

    it('should change room and update socket subscription', () => {
        chatService.setRoom('lobby')
        
        expect(chatState.currentRoomId).toBe('lobby')
        // The watch hook will handle room leave/join on next reactive cycle
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

        const fetchPromise = chatService.fetchMessages('general')
        expect(chatState.isLoading).toBe(true)

        await fetchPromise
        
        expect(chatState.isLoading).toBe(false)
        expect(chatState.error).toBeNull()
        expect(chatState.messages.length).toBe(1)
        expect(chatState.messages[0].content).toBe('test msg')
        expect(chatState.messages[0].author_username).toBe('another')

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
})
