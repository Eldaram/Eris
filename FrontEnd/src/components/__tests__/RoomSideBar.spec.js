import { mount } from '@vue/test-utils'
import RoomSideBar from '../RoomSideBar.vue'

describe('RoomSideBar.vue', () => {
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
})
