import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../../views/LoginView.vue'

// Create a mock router to use in tests
const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div>Home</div>' } }]
})

describe('LoginView.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(LoginView, {
            global: {
                plugins: [router]
            }
        })

        expect(wrapper.find('h1').text()).toBe('Welcome to Eris')
        expect(wrapper.find('input[type="text"]').exists()).toBe(true)
        expect(wrapper.find('input[type="password"]').exists()).toBe(true)
        expect(wrapper.find('button.login-button').text()).toBe('Login')
    })

    it('updates v-model values when typing', async () => {
        const wrapper = mount(LoginView, {
            global: {
                plugins: [router]
            }
        })

        const usernameInput = wrapper.find('input[type="text"]')
        const passwordInput = wrapper.find('input[type="password"]')

        await usernameInput.setValue('testuser')
        await passwordInput.setValue('password123')

        expect(usernameInput.element.value).toBe('testuser')
        expect(passwordInput.element.value).toBe('password123')
    })

    it('navigates to home on submit', async () => {
        // Spy on router.push
        const pushSpy = vi.spyOn(router, 'push')

        const wrapper = mount(LoginView, {
            global: {
                plugins: [router]
            }
        })

        // Fill out the form
        await wrapper.find('input[type="text"]').setValue('testuser')
        await wrapper.find('input[type="password"]').setValue('password123')

        // Submit the form
        await wrapper.find('form').trigger('submit.prevent')

        // Expect router.push to have been called with '/'
        expect(pushSpy).toHaveBeenCalledWith('/')
    })
})
