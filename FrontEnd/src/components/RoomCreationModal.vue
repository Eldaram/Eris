<script setup>
import { computed, ref } from 'vue'
import AuthInput from './AuthInput.vue'
import { serverService } from '../services/server'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  serverId: {
    type: String,
    required: true
  },
  serverName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'created', 'error'])

const roomName = ref('')
const isSubmitting = ref(false)
const maxLength = 24

const characterCount = computed(() => roomName.value.length)

const handleClose = () => {
  roomName.value = ''
  emit('close')
}

const handleSubmit = async () => {
  const trimmedName = roomName.value.trim()

  if (!trimmedName) return

  isSubmitting.value = true

  try {
    const result = await serverService.createRoom(props.serverId, trimmedName)
    emit('created', result)
    handleClose()
  } catch (error) {
    emit('error', error.message || 'An error occurred while creating the room')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click.self="handleClose"
    >
      <div class="modal-content">
        <header class="modal-header">
          <h2>Create a Room</h2>
          <button
            class="close-btn"
            type="button"
            aria-label="Close room creation dialog"
            @click="handleClose"
          >
            ×
          </button>
        </header>

        <form
          class="modal-body"
          @submit.prevent="handleSubmit"
        >
          <p>
            Add a new room inside {{ serverName || 'this server' }}. Keep the name short and clear.
          </p>

          <AuthInput
            id="room-name"
            v-model="roomName"
            label="ROOM NAME"
            placeholder="Enter room name"
            :disabled="isSubmitting"
            :max-length="maxLength"
            required
          />

          <div class="helper-row">
            <span>Up to 24 characters.</span>
            <span>{{ characterCount }}/{{ maxLength }}</span>
          </div>

          <footer class="modal-footer">
            <button
              class="cancel-btn"
              type="button"
              :disabled="isSubmitting"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              class="create-btn"
              type="submit"
              :disabled="isSubmitting || !roomName.trim()"
            >
              {{ isSubmitting ? 'Creating...' : 'Create Room' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--card-bg, #361134);
  width: min(92vw, 440px);
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.modal-header h2 {
  margin: 0;
  color: var(--text-main, #fff);
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted, #888);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-main, #fff);
}

.modal-body {
  padding: 0 1.5rem 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem;
  color: var(--text-muted, #888);
  font-size: 0.95rem;
}

.helper-row {
  margin-top: 0.6rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--text-muted, #888);
  font-size: 0.8rem;
}

.modal-footer {
  margin-top: 1.25rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn,
.create-btn {
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn {
  background: transparent;
  color: var(--text-main, #fff);
}

.create-btn {
  background-color: var(--primary, #B0228C);
  color: #fff;
}

.create-btn:hover:not(:disabled) {
  background-color: var(--primary-hover, #951e77);
}

.cancel-btn:disabled,
.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>