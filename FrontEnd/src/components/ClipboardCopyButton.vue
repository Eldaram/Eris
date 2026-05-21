<script setup>
import { ref } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: 'Copy'
  }
})

const emit = defineEmits(['copied', 'error'])
const isCopied = ref(false)
let resetTimer = null

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    isCopied.value = true
    emit('copied', props.text)
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      isCopied.value = false
    }, 1800)
  } catch (error) {
    emit('error', error)
  }
}
</script>

<template>
  <button class="clipboard-copy-button" type="button" @click="copyText">
    <span class="icon">{{ isCopied ? '✓' : '⧉' }}</span>
    <span>{{ isCopied ? 'Copied' : label }}</span>
  </button>
</template>

<style scoped>
.clipboard-copy-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--input-border, #4a1447);
  background: var(--input-bg, #240b23);
  color: var(--text-main, #fff);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.clipboard-copy-button:hover {
  border-color: var(--primary, #B0228C);
  transform: translateY(-1px);
}

.icon {
  font-size: 1rem;
}
</style>