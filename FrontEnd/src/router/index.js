import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { requiresAuth: true }
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { requiresUnauth: true }
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: { requiresUnauth: true }
        }
    ]
})

// Basic navigation guard
router.beforeEach((to, from) => {
    // TODO: Replace with actual authentication check
    const isAuthenticated = false // Hardcoded to false for now, meaning they always see login first

    if (to.meta.requiresAuth && !isAuthenticated) {
        // If trying to access a restricted page without being logged in
        return { name: 'login' }
    } else if (to.meta.requiresUnauth && isAuthenticated) {
        // If trying to access login/register while already logged in
        return { name: 'home' }
    }
})

export default router
