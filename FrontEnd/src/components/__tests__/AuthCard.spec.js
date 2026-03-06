import { mount } from '@vue/test-utils'
import AuthCard from '../AuthCard.vue'

describe('AuthCard.vue', () => {
    it('renders the title prop correctly', () => {
        const title = 'Test Title'
        const wrapper = mount(AuthCard, {
            props: { title }
        })

        expect(wrapper.find('h1').text()).toBe(title)
        // Ensure subtitle is not rendered if not provided
        expect(wrapper.find('p').exists()).toBe(false)
    })

    it('renders the subtitle prop when provided', () => {
        const title = 'Test Title'
        const subtitle = 'Test Subtitle'
        const wrapper = mount(AuthCard, {
            props: { title, subtitle }
        })

        expect(wrapper.find('h1').text()).toBe(title)
        expect(wrapper.find('p').exists()).toBe(true)
        expect(wrapper.find('p').text()).toBe(subtitle)
    })

    it('renders default slot content', () => {
        const title = 'Test Title'
        const slotContent = '<div class="test-slot">Slot Content</div>'
        const wrapper = mount(AuthCard, {
            props: { title },
            slots: {
                default: slotContent
            }
        })

        expect(wrapper.find('.test-slot').exists()).toBe(true)
        expect(wrapper.find('.test-slot').text()).toBe('Slot Content')
    })
})
