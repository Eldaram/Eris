<script setup>
// Message input functionality
</script>

<template>
  <div class="message-input-container">
    <div class="input-wrapper">
      <input type="text" placeholder="Message #general" class="message-input" />
    </div>
  </div>
</template>

<style scoped>
.message-input-container {
  padding: 0 1rem 1.5rem 1rem;
  background-color: var(--card-bg, #361134);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--input-bg, #240b23);
  border-radius: 8px;
  padding: 0.5rem 1rem;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-main, #fff);
  outline: none;
  font-size: 1rem;
  padding: 0.25rem;
}

.message-input::placeholder {
  color: var(--text-muted, #888);
}
</style>
