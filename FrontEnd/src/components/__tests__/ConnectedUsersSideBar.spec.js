import { mount } from '@vue/test-utils'
import ConnectedUsersSideBar from '../ConnectedUsersSideBar.vue'

describe('ConnectedUsersSideBar.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(ConnectedUsersSideBar)
        expect(wrapper.text()).toContain('ONLINE — 2')
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('Bob')
        expect(wrapper.text()).toContain('OFFLINE — 1')
        expect(wrapper.text()).toContain('Charlie')
        expect(wrapper.find('.user-item.offline').exists()).toBe(true)
    })
})
