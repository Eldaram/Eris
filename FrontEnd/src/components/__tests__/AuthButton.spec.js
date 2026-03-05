import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AuthButton from '../AuthButton.vue'

describe('AuthButton.vue', () => {
    it('renders the text prop correctly', () => {
        const text = 'Click Me'
        const wrapper = mount(AuthButton, {
            props: { text }
        })

        expect(wrapper.find('button').text()).toBe(text)
    })

    it('applies the default type attribute', () => {
        const wrapper = mount(AuthButton, {
            props: { text: 'Test' }
        })

        expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('applies a custom type attribute when provided', () => {
        const wrapper = mount(AuthButton, {
            props: {
                text: 'Submit',
                type: 'submit'
            }
        })

        expect(wrapper.find('button').attributes('type')).toBe('submit')
    })
})
