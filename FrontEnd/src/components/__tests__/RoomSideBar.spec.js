import { mount } from '@vue/test-utils'
import RoomSideBar from '../RoomSideBar.vue'
import { serverService } from '../../services/server'

vi.mock('../../services/server', () => ({
    serverService: {
        getChannels: vi.fn().mockResolvedValue([]),
        isServerOwner: vi.fn().mockResolvedValue({ isOwner: false }),
        createRoom: vi.fn()
    }
}))

describe('RoomSideBar.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const wrapper = mount(RoomSideBar)
        expect(wrapper.text()).toContain('Rooms')
        expect(wrapper.text()).toContain('general')
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

        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.find('.room-btn').exists()).toBe(true)
    })

    it('opens the room modal and refreshes channels after creation', async () => {
        serverService.isServerOwner.mockResolvedValueOnce({ isOwner: true })
        serverService.getChannels.mockResolvedValueOnce([{ id: 'room-1', name: 'general', isDm: false }])
        serverService.createRoom.mockResolvedValueOnce({ success: true, room: { id: 'room-2', name: 'announcements', serverId: 'server-1' } })
        serverService.getChannels.mockResolvedValueOnce([
            { id: 'room-1', name: 'general', isDm: false },
            { id: 'room-2', name: 'announcements', isDm: false }
        ])

        const wrapper = mount(RoomSideBar, {
            props: {
                selectedServer: { id: 'server-1', name: 'Sky Lounge', ownerId: 'owner-1' }
            },
            global: {
                stubs: { Teleport: true }
            }
        })

        await new Promise(resolve => setTimeout(resolve, 0))

        await wrapper.find('.room-btn').trigger('click')
        expect(wrapper.find('input#room-name').exists()).toBe(true)

        await wrapper.find('input#room-name').setValue('announcements')
        await wrapper.find('form').trigger('submit')

        await vi.waitFor(() => expect(serverService.createRoom).toHaveBeenCalled())

        expect(serverService.createRoom).toHaveBeenCalledWith('server-1', 'announcements')
        expect(serverService.getChannels).toHaveBeenCalledTimes(2)
    })
})
