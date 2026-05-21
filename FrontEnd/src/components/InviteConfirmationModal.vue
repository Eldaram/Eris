<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  serverName: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => emit('close')
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
          <h2>Join Server?</h2>
          <button
            class="close-btn"
            aria-label="Close invitation popup"
            @click="handleClose"
          >
            ×
          </button>
        </header>

        <main class="modal-body">
          <p>You are about to join the following server.</p>
          <div class="server-card">
            <span class="server-label">Server</span>
            <strong>{{ serverName }}</strong>
          </div>
        </main>

        <footer class="modal-footer">
          <button
            class="cancel-btn"
            :disabled="loading"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            class="confirm-btn"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? 'Joining...' : 'Accept' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  width: min(92vw, 460px);
  background: var(--card-bg, #361134);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
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

.modal-body {
  padding: 0 1.5rem 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem;
  color: var(--text-muted, #888);
}

.server-card {
  background: var(--input-bg, #240b23);
  border: 1px solid var(--input-border, #4a1447);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.server-label {
  color: var(--text-muted, #888);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.server-card strong {
  color: var(--text-main, #fff);
  font-size: 1.05rem;
}

.modal-footer {
  background: var(--input-bg, #240b23);
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.1rem;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn {
  background: transparent;
  color: var(--text-main, #fff);
}

.confirm-btn {
  background: var(--primary, #B0228C);
  color: #fff;
}

.confirm-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>