<script setup>
import { computed } from 'vue'
import ClipboardCopyButton from './ClipboardCopyButton.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  serverName: {
    type: String,
    default: ''
  },
  inviteUrl: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'copied'])

const formattedExpiry = computed(() => {
  if (!props.expiresAt) return ''
  const date = new Date(props.expiresAt)
  return new Intl.DateTimeFormat([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
})

const handleClose = () => emit('close')
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <header class="modal-header">
          <h2>Invite Link</h2>
          <button class="close-btn" @click="handleClose" aria-label="Close invite popup">×</button>
        </header>

        <main class="modal-body">
          <p class="server-name">{{ serverName }}</p>
          <div class="field-group">
            <label for="invite-link">Invite link</label>
            <input id="invite-link" :value="inviteUrl" readonly />
          </div>
          <div class="meta-row">
            <span class="meta-label">Expires</span>
            <span class="meta-value">{{ formattedExpiry }}</span>
          </div>
        </main>

        <footer class="modal-footer">
          <ClipboardCopyButton :text="inviteUrl" label="Copy link" @copied="$emit('copied')" />
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
  width: min(92vw, 520px);
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

.server-name {
  margin: 0 0 1rem;
  color: var(--text-main, #fff);
  font-size: 1.05rem;
  font-weight: 700;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-group label,
.meta-label {
  color: var(--text-muted, #888);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-group input {
  background: var(--input-bg, #240b23);
  border: 1px solid var(--input-border, #4a1447);
  border-radius: 8px;
  padding: 0.8rem 0.9rem;
  color: var(--text-main, #fff);
  font-size: 0.92rem;
}

.meta-row {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.meta-value {
  color: var(--text-main, #fff);
  font-size: 0.95rem;
}

.modal-footer {
  background: var(--input-bg, #240b23);
  justify-content: flex-end;
}
</style>