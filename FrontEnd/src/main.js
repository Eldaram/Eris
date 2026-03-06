import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { authService } from './services/auth'

// Initialize authentication state from localStorage
authService.init()

const app = createApp(App)

app.use(router)

app.mount('#app')
