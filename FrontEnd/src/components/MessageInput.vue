<script setup>
import { ref } from 'vue'
import { chatState, chatService } from '../services/chat'

const messageText = ref('')
const isSending = ref(false)

const handleSend = async () => {
  const content = messageText.value.trim()
  if (!content || isSending.value) return

  isSending.value = true
  try {
    await chatService.sendMessage(content)
    messageText.value = '' // Clear input on success
  } catch (error) {
    console.error('[MessageInput] Failed to send message:', error)
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="message-input-container">
    <form
      class="input-wrapper"
      @submit.prevent="handleSend"
    >
      <input
        v-model="messageText"
        type="text"
        :placeholder="chatState.currentRoomId ? `Message #${chatState.currentRoom?.name || chatState.currentRoomId}` : 'Choose a room to start chatting'"
        :disabled="isSending || !chatState.currentRoomId"
        class="message-input"
      >
      <button 
        type="submit" 
        :disabled="!chatState.currentRoomId || !messageText.trim() || isSending"
        class="send-button"
        aria-label="Send message"
      >
        <svg
          viewBox="0 0 24 24"
          class="send-icon"
        >
          <path
            d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
            fill="currentColor"
          />
        </svg>
      </button>
    </form>
  </div>
</template>

<style scoped>
.message-input-container {
  padding: 0 1.5rem 1.5rem 1.5rem;
  background-color: var(--card-bg, #361134);
  flex-shrink: 0;
  border-top: 1px solid var(--input-border, #4a1447);
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--input-bg, #240b23);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--input-border, #4a1447);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--primary, #B0228C);
  box-shadow: 0 0 0 2px rgba(176, 34, 140, 0.2);
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

.message-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.send-button {
  background: transparent;
  border: none;
  color: var(--text-muted, #888);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.2s, transform 0.1s;
}

.send-button:not(:disabled):hover {
  color: var(--primary, #B0228C);
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.send-icon {
  width: 20px;
  height: 20px;
}
</style>
