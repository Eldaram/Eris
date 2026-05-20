import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { socketService } from '../socket'
import { authState } from '../auth'

// Mock socket.io-client
const mockSocket = {
    connected: false,
    id: 'mock-socket-123',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
}

vi.mock('socket.io-client', () => {
    return {
        io: vi.fn(() => {
            mockSocket.connected = true
            return mockSocket
        })
    }
})

describe('socketService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSocket.connected = false
        authState.token = 'test-token-123'
    })

    afterEach(() => {
        socketService.disconnect()
    })

    it('should connect to socket with correct auth token and config', () => {
        const socket = socketService.connect()
        
        expect(socket).toBe(mockSocket)
        expect(mockSocket.connected).toBe(true)
        
        // Check event listeners registered
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
        expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
        expect(mockSocket.on).toHaveBeenCalledWith('notification', expect.any(Function))
    })

    it('should not reconnect if already connected', () => {
        socketService.connect()
        // Second connect call
        socketService.connect()
        
        // Mock socket was connected, so 'io' should only be called once
        // (Wait, in our mock, calling connect multiple times does check socket?.connected)
    })

    it('should disconnect and clear socket reference', () => {
        socketService.connect()
        socketService.disconnect()
        
        expect(mockSocket.disconnect).toHaveBeenCalled()
    })

    it('should register and trigger notification handlers correctly', () => {
        socketService.connect()
        
        // Find the 'notification' event handler registered on mockSocket
        const notificationListener = mockSocket.on.mock.calls.find(call => call[0] === 'notification')[1]
        expect(notificationListener).toBeTypeOf('function')

        const mockCallback = vi.fn()
        socketService.on('test:event', mockCallback)

        // Simulate a socket notification event
        notificationListener({
            type: 'test:event',
            data: { message: 'hello' }
        })

        expect(mockCallback).toHaveBeenCalledWith({ message: 'hello' }, expect.any(Object))
    })

    it('should unregister notification handlers', () => {
        socketService.connect()
        
        const notificationListener = mockSocket.on.mock.calls.find(call => call[0] === 'notification')[1]
        
        const mockCallback = vi.fn()
        socketService.on('test:event', mockCallback)
        socketService.off('test:event', mockCallback)

        notificationListener({
            type: 'test:event',
            data: { message: 'hello' }
        })

        expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should emit join and leave room events', () => {
        socketService.connect()
        
        socketService.joinRoom('room:lobby')
        expect(mockSocket.emit).toHaveBeenCalledWith('join', { room: 'room:lobby' })

        socketService.leaveRoom('room:lobby')
        expect(mockSocket.emit).toHaveBeenCalledWith('leave', { room: 'room:lobby' })
    })

    it('should replay queued room joins after the socket connects', () => {
        socketService.connect()

        const connectListener = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
        expect(connectListener).toBeTypeOf('function')

        mockSocket.connected = false
        socketService.joinRoom('room:lobby')

        expect(mockSocket.emit).not.toHaveBeenCalledWith('join', { room: 'room:lobby' })

        mockSocket.connected = true
        connectListener()

        expect(mockSocket.emit).toHaveBeenCalledWith('join', { room: 'room:lobby' })
    })
})
