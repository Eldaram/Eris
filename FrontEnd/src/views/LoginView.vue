<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import AuthInput from '../components/AuthInput.vue'
import AuthButton from '../components/AuthButton.vue'
import NotificationCard from '../components/NotificationCard.vue'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')

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

const handleLogin = () => {
  // TODO: Link to backend for real authentication later
  // For now, this just visually logs in by navigating to home
  router.push('/')
}
</script>

<template>
  <AuthCard title="Welcome to Eris" subtitle="Please log in to continue">
    <form @submit.prevent="handleLogin" class="login-form">
      <AuthInput
        id="username"
        v-model="username"
        label="Username"
        placeholder="Enter your username"
        required
      />
      
      <AuthInput
        id="password"
        v-model="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
      />
      
      <AuthButton text="Login" type="submit" />

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
