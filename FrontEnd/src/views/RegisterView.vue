<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import AuthInput from '../components/AuthInput.vue'
import AuthButton from '../components/AuthButton.vue'
import NotificationCard from '../components/NotificationCard.vue'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const notification = ref({
  visible: false,
  message: '',
  type: 'error'
})

const showNotification = (message, type = 'error') => {
  notification.value = {
    visible: true,
    message,
    type
  }
}

const closeNotification = () => {
  notification.value.visible = false
}

const handleRegister = async () => {
  isLoading.value = true
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle validation errors
      showNotification(data.error || 'Registration failed', 'error')
      return
    }

    // Success - redirect to login with success notification
    router.push({
      path: '/login',
      query: { registered: 'true' }
    })
  } catch (error) {
    showNotification('Unable to connect to the server. Please try again later.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthCard title="Create an Account" subtitle="Join Eris today">
    <form @submit.prevent="handleRegister" class="register-form">
      <AuthInput
        id="username"
        v-model="username"
        label="Username"
        placeholder="Choose a username"
        required
        :disabled="isLoading"
      />

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
        placeholder="Create a password"
        required
        :disabled="isLoading"
      />

      <AuthInput
        id="confirmPassword"
        v-model="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        required
        :disabled="isLoading"
      />
      
      <AuthButton :text="isLoading ? 'Creating Account...' : 'Create Account'" type="submit" :disabled="isLoading" />

      <div class="login-link">
        Already have an account? <router-link to="/login">Log in</router-link>
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
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted, #888);
}

.login-link a {
  color: var(--primary, #646cff);
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>

