import { mount } from '@vue/test-utils'
import UserProfileCard from '../UserProfileCard.vue'

describe('UserProfileCard.vue', () => {
    it('renders with default props', () => {
        const wrapper = mount(UserProfileCard)
        expect(wrapper.text()).toContain('Current User')
        expect(wrapper.text()).toContain('Online')
        expect(wrapper.find('.avatar').text()).toBe('C')
        expect(wrapper.find('.status-indicator.online').exists()).toBe(true)
    })

    it('renders with custom props', () => {
        const wrapper = mount(UserProfileCard, {
            props: {
                username: 'Alice',
                status: 'Idle'
            }
        })
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('Idle')
        expect(wrapper.find('.avatar').text()).toBe('A')
        expect(wrapper.find('.status-indicator.idle').exists()).toBe(true)
    })
})
