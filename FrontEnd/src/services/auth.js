import { reactive } from 'vue'
import { getApiBaseUrl } from './apiBase'

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

                if (token) {
                    // Synchronously set initial auth state to avoid unauthenticated redirects
                    authState.token = token
                    authState.user = user
                    authState.isAuthenticated = true

                    // Asynchronously verify token and sync user with PostgreSQL in the background
                    const apiUrl = getApiBaseUrl()
                    fetch(`${apiUrl}/api/users/me`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(async (response) => {
                        if (response.ok) {
                            const freshUser = await response.json()
                            authState.user = freshUser
                            localStorage.setItem(STATE_KEY, JSON.stringify({ token, user: freshUser }))
                        } else if (response.status === 401) {
                            console.warn('[AuthService] Token validation failed in background. Logging out.');
                            this.logout()
                        }
                    })
                    .catch((err) => {
                        console.error('[AuthService] Failed background token validation check:', err)
                    })
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
            const apiUrl = getApiBaseUrl()
            const response = await fetch(`${apiUrl}/api/users/login`, {
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
