import { mount } from '@vue/test-utils'
import MessageInput from '../MessageInput.vue'

describe('MessageInput.vue', () => {
    it('renders input correctly', () => {
        const wrapper = mount(MessageInput)
        const input = wrapper.find('input')
        expect(input.exists()).toBe(true)
        expect(input.attributes('placeholder')).toBe('Message #general')
        expect(wrapper.findAll('.action-btn').length).toBe(0)
    })
})
