<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/auth'
import AuthCard from '../components/AuthCard.vue'
import AuthInput from '../components/AuthInput.vue'
import AuthButton from '../components/AuthButton.vue'
import NotificationCard from '../components/NotificationCard.vue'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const notification = ref({
  visible: false,
  message: '',
  type: 'success'
})

const showNotification = (message, type = 'success') => {
  notification.value = {
    visible: true,
    message,
    type
  }
}

const closeNotification = () => {
  notification.value.visible = false
}

onMounted(() => {
  // Check if user was redirected from successful registration
  if (route.query.registered === 'true') {
    showNotification('Account created successfully! Please log in.', 'success')
    // Clean up the query parameter
    router.replace({ path: '/login' })
  }
})

const handleLogin = async () => {
  isLoading.value = true
  closeNotification()

  try {
    await authService.login(email.value, password.value)
    // Redirect to home page upon successful login
    router.push('/')
  } catch (error) {
    showNotification(error.message || 'Login failed', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthCard title="Welcome to Eris" subtitle="Please log in to continue">
    <form @submit.prevent="handleLogin" class="login-form">
      <AuthInput
        id="email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
        :disabled="isLoading"
      />
      
      <AuthInput
        id="password"
        v-model="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
        :disabled="isLoading"
      />
      
      <AuthButton :text="isLoading ? 'Logging in...' : 'Login'" type="submit" :disabled="isLoading" />

      <div class="register-link">
        Don't have an account? <router-link to="/register">Create one</router-link>
      </div>
    </form>
  </AuthCard>

  <NotificationCard
    :visible="notification.visible"
    :message="notification.message"
    :type="notification.type"
    @close="closeNotification"
  />
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted, #888);
}

.register-link a {
  color: var(--primary, #646cff);
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
