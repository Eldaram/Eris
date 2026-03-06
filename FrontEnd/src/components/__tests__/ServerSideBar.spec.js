import { mount } from '@vue/test-utils'
import ServerSideBar from '../ServerSideBar.vue'

describe('ServerSideBar.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(ServerSideBar)
        expect(wrapper.classes()).toContain('server-sidebar')
        expect(wrapper.find('.server-item.empty-state').exists()).toBe(true)
    })
})
