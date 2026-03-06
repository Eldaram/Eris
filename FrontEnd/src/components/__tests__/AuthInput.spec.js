import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AuthInput from '../AuthInput.vue'

describe('AuthInput.vue', () => {
    const defaultProps = {
        modelValue: '',
        id: 'test-id',
        label: 'Test Label'
    }

    it('renders properly with required props', () => {
        const wrapper = mount(AuthInput, {
            props: defaultProps
        })

        expect(wrapper.find('label').text()).toBe('Test Label')
        expect(wrapper.find('label').attributes('for')).toBe('test-id')

        const input = wrapper.find('input')
        expect(input.attributes('id')).toBe('test-id')
        expect(input.attributes('type')).toBe('text') // default type
        expect(input.element.required).toBe(false)    // default required
    })

    it('applies optional props correctly', () => {
        const wrapper = mount(AuthInput, {
            props: {
                ...defaultProps,
                type: 'email',
                placeholder: 'Enter email here',
                required: true
            }
        })

        const input = wrapper.find('input')
        expect(input.attributes('type')).toBe('email')
        expect(input.attributes('placeholder')).toBe('Enter email here')
        expect(input.element.required).toBe(true)
    })

    it('emits update:modelValue event when input value changes', async () => {
        const wrapper = mount(AuthInput, {
            props: defaultProps
        })

        const input = wrapper.find('input')
        await input.setValue('new value')

        const emittedEvents = wrapper.emitted('update:modelValue')
        expect(emittedEvents).toBeTruthy()
        expect(emittedEvents[0]).toEqual(['new value'])
    })

    it('binds initial modelValue correctly', () => {
        const wrapper = mount(AuthInput, {
            props: {
                ...defaultProps,
                modelValue: 'Initial Value'
            }
        })

        const input = wrapper.find('input')
        expect(input.element.value).toBe('Initial Value')
    })
})
