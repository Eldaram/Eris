<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'success'].includes(value)
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const isHovered = ref(false)
let timeoutId = null

const startTimer = () => {
  clearTimeout(timeoutId)
  if (!isHovered.value) {
    timeoutId = setTimeout(() => {
      emit('close')
    }, 4000)
  }
}

const handleMouseEnter = () => {
  isHovered.value = true
  clearTimeout(timeoutId)
}

const handleMouseLeave = () => {
  isHovered.value = false
  startTimer()
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    startTimer()
  } else {
    clearTimeout(timeoutId)
  }
})

onMounted(() => {
  if (props.visible) {
    startTimer()
  }
})
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="visible"
      :class="['notification-card', type]"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="notification-icon">
        <span v-if="type === 'success'">✓</span>
        <span v-else>✕</span>
      </div>
      <div class="notification-content">
        <p class="notification-message">{{ message }}</p>
      </div>
      <button class="notification-close" @click="$emit('close')" aria-label="Close notification">
        ×
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.notification-card {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.notification-card.error {
  background: rgba(220, 38, 38, 0.95);
  color: white;
  border-left: 4px solid #b91c1c;
}

.notification-card.success {
  background: rgba(34, 197, 94, 0.95);
  color: white;
  border-left: 4px solid #16a34a;
}

.notification-icon {
  font-size: 1.5rem;
  font-weight: bold;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.notification-content {
  flex: 1;
}

.notification-message {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Transition animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
