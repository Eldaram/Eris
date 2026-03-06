import { reactive } from 'vue'

const STATE_KEY = 'auth_state'

export const authState = reactive({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false
})

export const authService = {
    /**
     * Initialize state from localStorage on app startup
     */
    async init() {
        if (authState.isInitialized) return

        const storedData = localStorage.getItem(STATE_KEY)
        if (storedData) {
            try {
                const { token, user } = JSON.parse(storedData)

                // For security, optionally verify token against backend right here
                // Currently, we trust the stored state if it exists until a backend call fails with 401

                if (token) {
                    authState.token = token
                    authState.user = user
                    authState.isAuthenticated = true
                }
            } catch (e) {
                console.error('Failed to parse stored auth state', e)
                this.logout() // Clear corrupt data
            }
        }
        authState.isInitialized = true
    },

    /**
     * Log a user in
     */
    async login(email, password) {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            // Update reactive state
            authState.user = data.user
            authState.token = data.token
            authState.isAuthenticated = true

            // Persist state
            localStorage.setItem(STATE_KEY, JSON.stringify({
                token: data.token,
                user: data.user
            }))

            return data
        } catch (error) {
            console.error('Login error:', error)
            throw error // Re-throw to be handled by the component
        }
    },

    /**
     * Log a user out
     */
    logout() {
        authState.user = null
        authState.token = null
        authState.isAuthenticated = false
        localStorage.removeItem(STATE_KEY)
    },

    /**
     * Get formatting authorization header value
     */
    getAuthHeader() {
        if (authState.token) {
            return { 'Authorization': `Bearer ${authState.token}` }
        }
        return {}
    }
}
