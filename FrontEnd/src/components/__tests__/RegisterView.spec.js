import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../../views/RegisterView.vue'

// Create a mock router to use in tests
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/login', name: 'login', component: { template: '<div>Login</div>' } }
    ]
})

describe('RegisterView.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(RegisterView, {
            global: {
                plugins: [router],
                stubs: ['router-link']
            }
        })

        // Instead of directly finding standard HTML elements, wait for the nested ones
        // AuthCard should render the title
        expect(wrapper.html()).toContain('Create an Account')

        // Form should contain inputs
        const inputs = wrapper.findAll('input')
        expect(inputs.length).toBe(4) // username, email, password, confirmPassword

        expect(wrapper.find('button[type="submit"]').text()).toBe('Create Account')
    })

    it('updates v-model values when typing', async () => {
        const wrapper = mount(RegisterView, {
            global: {
                plugins: [router],
                stubs: ['router-link']
            }
        })

        const inputs = wrapper.findAll('input')
        const usernameInput = inputs[0]
        const emailInput = inputs[1]
        const passwordInput = inputs[2]
        const confirmPasswordInput = inputs[3]

        await usernameInput.setValue('testuser')
        await emailInput.setValue('test@example.com')
        await passwordInput.setValue('password123')
        await confirmPasswordInput.setValue('password123')

        expect(usernameInput.element.value).toBe('testuser')
        expect(emailInput.element.value).toBe('test@example.com')
        expect(passwordInput.element.value).toBe('password123')
        expect(confirmPasswordInput.element.value).toBe('password123')
    })

    it('navigates to login on submit', async () => {
        // Spy on router.push
        const pushSpy = vi.spyOn(router, 'push')

        const wrapper = mount(RegisterView, {
            global: {
                plugins: [router],
                stubs: ['router-link']
            }
        })

        // Fill out the form
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('testuser')
        await inputs[1].setValue('test@example.com')
        await inputs[2].setValue('password123')
        await inputs[3].setValue('password123')

        // Submit the form
        await wrapper.find('form').trigger('submit.prevent')

        // Expect router.push to have been called with '/login'
        expect(pushSpy).toHaveBeenCalledWith('/login')
    })
})
