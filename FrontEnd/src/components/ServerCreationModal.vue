<script setup>
import { ref } from 'vue'
import { serverService } from '../services/server'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'created', 'error'])

const serverName = ref('')
const isSubmitting = ref(false)

const handleClose = () => {
  serverName.value = ''
  emit('close')
}

const handleSubmit = async () => {
  if (!serverName.value.trim()) return

  isSubmitting.value = true
  try {
    const result = await serverService.createServer(serverName.value.trim())
    emit('created', result)
    handleClose()
  } catch (error) {
    emit('error', error.message || 'An error occurred during server creation')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <header class="modal-header">
          <h2>Create a Server</h2>
          <button class="close-btn" @click="handleClose">×</button>
        </header>

        <main class="modal-body">
          <p>Give your new server a personality with a name. You can always change it later.</p>
          <div class="form-group">
            <label for="server-name">SERVER NAME</label>
            <input
              id="server-name"
              v-model="serverName"
              type="text"
              placeholder="Enter server name"
              :disabled="isSubmitting"
              @keyup.enter="handleSubmit"
            />
          </div>
        </main>

        <footer class="modal-footer">
          <button class="cancel-btn" @click="handleClose" :disabled="isSubmitting">
            Cancel
          </button>
          <button
            class="create-btn"
            @click="handleSubmit"
            :disabled="isSubmitting || !serverName.trim()"
          >
            {{ isSubmitting ? 'Creating...' : 'Create' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--card-bg, #361134);
  width: 90%;
  max-width: 440px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-main, #fff);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted, #888);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-main, #fff);
}

.modal-body {
  padding: 0 1.5rem 1.5rem;
}

.modal-body p {
  color: var(--text-muted, #888);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--text-muted, #888);
}

.form-group input {
  background-color: var(--input-bg, #240b23);
  border: 1px solid var(--input-border, #4a1447);
  padding: 0.75rem;
  border-radius: 4px;
  color: var(--text-main, #fff);
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: var(--primary, #B0228C);
}

.modal-footer {
  background-color: var(--input-bg, #240b23);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  background: none;
  border: none;
  color: var(--text-main, #fff);
  cursor: pointer;
  font-weight: 500;
  padding: 0.75rem 1rem;
}

.create-btn {
  background-color: var(--primary, #B0228C);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-btn:hover:not(:disabled) {
  background-color: var(--primary-hover, #951e77);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
