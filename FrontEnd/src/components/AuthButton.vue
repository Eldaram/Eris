<script setup>
defineProps({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button :type="type" :disabled="disabled" class="auth-button">
    {{ text }}
  </button>
</template>

<style scoped>
.auth-button {
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
  width: 100%;
  box-sizing: border-box;
}

.auth-button:hover {
  background-color: var(--primary-hover, #535bf2);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--primary, #646cff);
}
</style>
