import { mount } from '@vue/test-utils'
import RoomSideBar from '../RoomSideBar.vue'
import { serverService } from '../../services/server'
import { authState } from '../../services/auth'
import { socketService } from '../../services/socket'

vi.mock('../../services/server', () => ({
    serverService: {
        getChannels: vi.fn().mockResolvedValue([]),
        isServerOwner: vi.fn().mockResolvedValue({ isOwner: false }),
        createRoom: vi.fn()
    }
}))

const notificationHandlers = new Map()

vi.mock('../../services/socket', () => ({
    socketService: {
        joinRoom: vi.fn(),
        leaveRoom: vi.fn(),
        on: vi.fn((type, callback) => {
            notificationHandlers.set(type, callback)
        }),
        off: vi.fn((type) => {
            notificationHandlers.delete(type)
        })
    }
}))

describe('RoomSideBar.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        notificationHandlers.clear()
        authState.user = { id: 'owner-1', username: 'Owner' }
        authState.token = 'test-token'
    })

    it('renders correctly', () => {
        const wrapper = mount(RoomSideBar)
        expect(wrapper.text()).toContain('Rooms')
        expect(wrapper.text()).toContain('Choose a server to see its rooms')
    })

    it('shows invite action when a server is selected and emits create-invite', async () => {
        const wrapper = mount(RoomSideBar, {
            props: {
                selectedServer: { id: 'server-1', name: 'Sky Lounge' }
            }
        })

        expect(wrapper.find('.invite-btn').exists()).toBe(true)

        await wrapper.find('.invite-btn').trigger('click')
        expect(wrapper.emitted()).toHaveProperty('create-invite')
    })

    it('shows the room creation button for the owner', async () => {
        serverService.isServerOwner.mockResolvedValueOnce({ isOwner: true })

        const wrapper = mount(RoomSideBar, {
            props: {
                selectedServer: { id: 'server-1', name: 'Sky Lounge', ownerId: 'owner-1' }
            }
        })

        await vi.waitFor(() => expect(wrapper.find('.room-btn').exists()).toBe(true))
    })

    it('joins the selected server room and refreshes channels on room-created notifications', async () => {
        serverService.isServerOwner.mockResolvedValueOnce({ isOwner: true })
        serverService.getChannels.mockResolvedValueOnce([{ id: 'room-1', name: 'general', isDm: false }])
        serverService.getChannels.mockResolvedValueOnce([
            { id: 'room-1', name: 'general', isDm: false },
            { id: 'room-2', name: 'announcements', isDm: false }
        ])

        mount(RoomSideBar, {
            props: {
                selectedServer: { id: 'server-1', name: 'Sky Lounge', ownerId: 'owner-1' }
            },
            global: {
                stubs: { Teleport: true }
            }
        })

        await new Promise(resolve => setTimeout(resolve, 0))

        expect(socketService.joinRoom).toHaveBeenCalledWith('server:server-1')
        expect(notificationHandlers.has('room:created')).toBe(true)

        await notificationHandlers.get('room:created')({ serverId: 'server-1', roomId: 'room-2', roomName: 'announcements' })

        expect(serverService.getChannels).toHaveBeenCalledTimes(2)
    })

    it('emits room-selected when a room is clicked', async () => {
        serverService.isServerOwner.mockResolvedValueOnce({ isOwner: false })
        serverService.getChannels.mockResolvedValueOnce([
            { id: 'room-1', name: 'lobby', isDm: false },
        ])

        const wrapper = mount(RoomSideBar, {
            props: {
                selectedServer: { id: 'server-1', name: 'Sky Lounge' },
                selectedRoomId: 'room-1'
            }
        })

        await new Promise((resolve) => setTimeout(resolve, 0))

        const room = wrapper.find('.room-item:not(.empty-state)')
        await room.trigger('click')

        expect(wrapper.emitted('room-selected')).toBeTruthy()
        expect(wrapper.emitted('room-selected')[0][0]).toMatchObject({ id: 'room-1', name: 'lobby' })
    })
})
