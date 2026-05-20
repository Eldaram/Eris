import { mount } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ChatArea from '../ChatArea.vue'
import { chatState } from '../../services/chat'
import { authState } from '../../services/auth'

// Mock DOM elements scrollTo to avoid environment warnings
if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = vi.fn()
}

describe('ChatArea.vue', () => {
    beforeEach(() => {
        // Reset states before each test
        chatState.currentRoomId = 'general'
        chatState.messages = []
        chatState.isLoading = false
        chatState.error = null
        
        authState.user = { id: 'u1', username: 'testuser' }
    })

    it('renders empty state correctly', () => {
        const wrapper = mount(ChatArea)
        expect(wrapper.text()).toContain('#')
        expect(wrapper.text()).toContain('general')
        expect(wrapper.text()).toContain('Welcome to #general!')
        expect(wrapper.text()).toContain('This is the beginning of the chat channel history')
        expect(wrapper.find('.message').exists()).toBe(false)
    })

    it('renders messages correctly when populated', async () => {
        chatState.messages = [
            {
                id: 'm1',
                room_id: 'general',
                author_id: 'u1',
                author_username: 'testuser',
                content: 'Hello everyone!',
                createdAt: new Date().toISOString()
            },
            {
                id: 'm2',
                room_id: 'general',
                author_id: 'u2',
                author_username: 'friend',
                content: 'Hey there!',
                createdAt: new Date().toISOString()
            }
        ]

        const wrapper = mount(ChatArea)
        
        // Wait for rendering
        await wrapper.vm.$nextTick()

        // Check if messages list is rendered
        expect(wrapper.find('.message-list').exists()).toBe(true)
        expect(wrapper.findAll('.message').length).toBe(2)

        // Check own-message class for author matching
        const messages = wrapper.findAll('.message')
        expect(messages[0].classes()).toContain('own-message')
        expect(messages[1].classes()).not.toContain('own-message')

        // Check sender usernames and message content
        expect(wrapper.text()).toContain('testuser')
        expect(wrapper.text()).toContain('friend')
        expect(wrapper.text()).toContain('Hello everyone!')
        expect(wrapper.text()).toContain('Hey there!')
    })
})
