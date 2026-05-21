import { mount } from '@vue/test-utils'
import RoomCreationModal from '../RoomCreationModal.vue'
import { serverService } from '../../services/server'

vi.mock('../../services/server', () => ({
    serverService: {
        createRoom: vi.fn()
    }
}))

describe('RoomCreationModal.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the room form when visible', () => {
        const wrapper = mount(RoomCreationModal, {
            props: {
                show: true,
                serverId: 'server-1',
                serverName: 'Sky Lounge'
            },
            global: {
                stubs: { Teleport: true }
            }
        })

        expect(wrapper.find('h2').text()).toBe('Create a Room')
        expect(wrapper.find('input#room-name').exists()).toBe(true)
        expect(wrapper.text()).toContain('Up to 24 characters.')
    })

    it('limits the room name to 24 characters', async () => {
        const wrapper = mount(RoomCreationModal, {
            props: {
                show: true,
                serverId: 'server-1'
            },
            global: {
                stubs: { Teleport: true }
            }
        })

        await wrapper.find('input#room-name').setValue('x'.repeat(30))

        const input = wrapper.find('input#room-name')
        expect(input.attributes('maxlength')).toBe('24')
        expect(input.element.value.length).toBe(30)
    })

    it('creates a room and emits created on success', async () => {
        serverService.createRoom.mockResolvedValueOnce({
            success: true,
            room: { id: 'room-2', name: 'announcements', serverId: 'server-1' }
        })

        const wrapper = mount(RoomCreationModal, {
            props: {
                show: true,
                serverId: 'server-1',
                serverName: 'Sky Lounge'
            },
            global: {
                stubs: { Teleport: true }
            }
        })

        await wrapper.find('input#room-name').setValue('announcements')
        await wrapper.find('form').trigger('submit')

        await vi.waitFor(() => expect(serverService.createRoom).toHaveBeenCalled())

        expect(serverService.createRoom).toHaveBeenCalledWith('server-1', 'announcements')
        expect(wrapper.emitted()).toHaveProperty('created')
        expect(wrapper.emitted().created[0][0]).toEqual({
            success: true,
            room: { id: 'room-2', name: 'announcements', serverId: 'server-1' }
        })
    })
})