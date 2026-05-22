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
        chatState.currentRoomId = null
        chatState.currentRoom = null
        chatState.messages = []
        chatState.isLoading = false
        chatState.isLoadingMore = false
        chatState.error = null
        chatState.hasMoreMessages = false
        chatState.oldestMessageId = null
        chatState.shouldScrollToBottom = false
        
        authState.user = { id: 'u1', username: 'testuser' }
    })

    it('renders the room selection prompt when no room is selected', () => {
        const wrapper = mount(ChatArea)
        expect(wrapper.text()).toContain('Choose a room')
        expect(wrapper.text()).toContain('Select a room from the sidebar')
        expect(wrapper.find('.chat-header').exists()).toBe(false)
        expect(wrapper.find('.message').exists()).toBe(false)
    })

    it('renders messages correctly when a room is selected', async () => {
        chatState.currentRoomId = 'general'
        chatState.currentRoom = { id: 'general', name: 'general' }
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
        expect(wrapper.text()).toContain('general')

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
