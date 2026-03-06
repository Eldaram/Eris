import { mount } from '@vue/test-utils'
import RoomSideBar from '../RoomSideBar.vue'

describe('RoomSideBar.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(RoomSideBar)
        expect(wrapper.text()).toContain('Rooms')
        expect(wrapper.text()).toContain('general')
    })
})
