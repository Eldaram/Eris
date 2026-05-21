import { mount } from '@vue/test-utils'
import MessageInput from '../MessageInput.vue'
import { chatState } from '../../services/chat'

describe('MessageInput.vue', () => {
    beforeEach(() => {
        chatState.currentRoomId = null
        chatState.currentRoom = null
    })

    it('renders input correctly', () => {
        const wrapper = mount(MessageInput)
        const input = wrapper.find('input')
        expect(input.exists()).toBe(true)
        expect(input.attributes('placeholder')).toBe('Choose a room to start chatting')
        expect(input.element.disabled).toBe(true)
        expect(wrapper.findAll('.action-btn').length).toBe(0)
    })
})
