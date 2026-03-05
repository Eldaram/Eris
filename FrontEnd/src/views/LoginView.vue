<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')

const handleLogin = () => {
  // TODO: Link to backend for real authentication later
  // For now, this just visually logs in by navigating to home
  router.push('/')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Welcome to Eris</h1>
      <p>Please log in to continue</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            id="username" 
            v-model="username" 
            type="text" 
            placeholder="Enter your username" 
            required 
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            placeholder="Enter your password" 
            required 
          />
        </div>
        
        <button type="submit" class="login-button">Login</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--bg-color, #242424);
}

.login-card {
  background-color: var(--card-bg, #2a2a2a);
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h1 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--text-main, rgba(255, 255, 255, 0.87));
  font-size: 2rem;
}

p {
  color: var(--text-muted, #888);
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-main, rgba(255, 255, 255, 0.87));
}

input {
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--input-border, #444);
  background-color: var(--input-bg, #1a1a1a);
  color: var(--text-main, #fff);
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--primary, #646cff);
}

input:invalid:not(:placeholder-shown) {
  border-color: var(--invalid, #ff4c4c);
}

input:valid:not(:placeholder-shown) {
  border-color: var(--valid, #42b883);
}

.login-button {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: var(--primary, #646cff);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: var(--primary-hover, #535bf2);
}
</style>
