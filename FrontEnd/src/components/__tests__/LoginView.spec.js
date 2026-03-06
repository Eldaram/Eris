import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../../views/LoginView.vue'
import { authService } from '../../services/auth'

// Mock the authService
vi.mock('../../services/auth', () => ({
    authService: {
        login: vi.fn(),
    },
}))

// Create a mock router to use in tests
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/register', name: 'register', component: { template: '<div>Register</div>' } }
    ]
})

describe('LoginView.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const mountOptions = {
        global: {
            plugins: [router]
        }
    }

    it('renders correctly', () => {
        const wrapper = mount(LoginView, mountOptions)

        expect(wrapper.find('h1').text()).toBe('Welcome to Eris')
        expect(wrapper.find('input[type="email"]').exists()).toBe(true)
        expect(wrapper.find('input[type="password"]').exists()).toBe(true)
        expect(wrapper.find('button.auth-button').text()).toBe('Login')
    })

    it('updates v-model values when typing', async () => {
        const wrapper = mount(LoginView, mountOptions)

        const emailInput = wrapper.find('input[type="email"]')
        const passwordInput = wrapper.find('input[type="password"]')

        await emailInput.setValue('test@example.com')
        await passwordInput.setValue('password123')

        expect(emailInput.element.value).toBe('test@example.com')
        expect(passwordInput.element.value).toBe('password123')
    })

    it('navigates to home on successful submit', async () => {
        const pushSpy = vi.spyOn(router, 'push')
        authService.login.mockResolvedValueOnce({ user: { id: 1 }, token: 'fake_token' })

        const wrapper = mount(LoginView, mountOptions)

        await wrapper.find('input[type="email"]').setValue('test@example.com')
        await wrapper.find('input[type="password"]').setValue('password123')
        await wrapper.find('form').trigger('submit.prevent')

        // Wait for the async login to flush
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(pushSpy).toHaveBeenCalledWith('/')
    })

    it('shows error notification on failed submit', async () => {
        authService.login.mockRejectedValueOnce(new Error('Invalid credentials'))

        const wrapper = mount(LoginView, mountOptions)

        await wrapper.find('input[type="email"]').setValue('wrong@example.com')
        await wrapper.find('input[type="password"]').setValue('badpass')
        await wrapper.find('form').trigger('submit.prevent')

        // Wait for the async login to flush
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(authService.login).toHaveBeenCalledWith('wrong@example.com', 'badpass')

        // Assert that NotificationCard gets the visible prop and error message
        const notification = wrapper.findComponent({ name: 'NotificationCard' })
        expect(notification.props('visible')).toBe(true)
        expect(notification.props('message')).toBe('Invalid credentials')
    })
})
