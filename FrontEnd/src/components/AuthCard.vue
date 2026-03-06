<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: false
  }
})
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
      
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-color, #242424);
}

.auth-card {
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
</style>
