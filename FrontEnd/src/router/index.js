import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
        }
    ]
})

// Basic navigation guard
router.beforeEach((to, from) => {
    // TODO: Replace with actual authentication check
    const isAuthenticated = false // Hardcoded to false for now, meaning they always see login first

    if (to.name !== 'login' && !isAuthenticated) {
        // If trying to access a restricted page without being logged in
        return { name: 'login' }
    }
})

export default router
