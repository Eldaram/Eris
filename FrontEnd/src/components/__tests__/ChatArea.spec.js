import { mount } from '@vue/test-utils'
import ChatArea from '../ChatArea.vue'

describe('ChatArea.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(ChatArea)
        expect(wrapper.text()).toContain('#')
        expect(wrapper.text()).toContain('general')
        expect(wrapper.text()).toContain('Welcome to #general!')
        expect(wrapper.find('.message').exists()).toBe(true)
    })
})
