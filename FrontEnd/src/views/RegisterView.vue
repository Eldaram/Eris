<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import AuthInput from '../components/AuthInput.vue'
import AuthButton from '../components/AuthButton.vue'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = () => {
  // TODO: Link to backend for real authentication later
  // For now, this just visually registers by navigating to login
  router.push('/login')
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
      />

      <AuthInput
        id="email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
      />
      
      <AuthInput
        id="password"
        v-model="password"
        label="Password"
        type="password"
        placeholder="Create a password"
        required
      />

      <AuthInput
        id="confirmPassword"
        v-model="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        required
      />
      
      <AuthButton text="Create Account" type="submit" />

      <div class="login-link">
        Already have an account? <router-link to="/login">Log in</router-link>
      </div>
    </form>
  </AuthCard>
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

