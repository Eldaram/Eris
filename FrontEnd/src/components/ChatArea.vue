<script setup>
import { ref, watch, nextTick } from 'vue'
import { chatState, chatService } from '../services/chat'
import { authState } from '../services/auth'

const messagesContainer = ref(null)
const isNearBottom = ref(true)
const suppressTopLoadUntil = ref(0)

const updateScrollPositionState = () => {
  if (!messagesContainer.value) {
    isNearBottom.value = true
    return
  }

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  isNearBottom.value = scrollTop + clientHeight >= scrollHeight - 32
}

const armTopLoadGuard = () => {
  suppressTopLoadUntil.value = Date.now() + 100
}

const scrollToBottom = async (smooth = true) => {
  await nextTick()

  if (messagesContainer.value && typeof messagesContainer.value.scrollTo === 'function') {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }

  updateScrollPositionState()
}

const preserveScrollAfterPrepend = async (previousScrollHeight, previousScrollTop) => {
  await nextTick()

  if (!messagesContainer.value) {
    return
  }

  const nextScrollHeight = messagesContainer.value.scrollHeight
  messagesContainer.value.scrollTop = nextScrollHeight - previousScrollHeight + previousScrollTop
  updateScrollPositionState()
}

const handleScroll = async () => {
  updateScrollPositionState()

  if (!chatState.currentRoomId || chatState.isLoadingMore || !chatState.hasMoreMessages) {
    return
  }

  if (Date.now() < suppressTopLoadUntil.value) {
    return
  }

  if (!messagesContainer.value || messagesContainer.value.scrollTop > 32) {
    return
  }

  const previousScrollHeight = messagesContainer.value.scrollHeight
  const previousScrollTop = messagesContainer.value.scrollTop

  await chatService.loadOlderMessages()
  armTopLoadGuard()
  await preserveScrollAfterPrepend(previousScrollHeight, previousScrollTop)
}

watch(() => chatState.shouldScrollToBottom, async (shouldScroll) => {
  if (!shouldScroll) {
    return
  }

  chatState.shouldScrollToBottom = false
  armTopLoadGuard()
  await scrollToBottom(false)
})

watch(() => chatState.messages.length, async (newLength, oldLength) => {
  if (newLength <= oldLength) {
    return
  }

  await nextTick()

  if (chatState.isLoadingMore) {
    return
  }

  if (chatState.shouldScrollToBottom) {
    return
  }

  if (isNearBottom.value) {
    armTopLoadGuard()
    await scrollToBottom(true)
  }
})

// Generate harmonious colors for avatars dynamically based on username hashing
const getAvatarStyle = (username) => {
  const colors = [
    '#B0228C', // Eris Magenta
    '#EA3788', // Light Rose
    '#646cff', // Royal Violet
    '#00b4d8', // Electric Cyan
    '#2a9d8f', // Soft Emerald
    '#e76f51', // Sunset Coral
    '#f4a261', // Ochre Sand
    '#9b5de5'  // Deep Orchid
  ]
  if (!username) return { backgroundColor: colors[0] }
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash % colors.length)
  return { backgroundColor: colors[index] }
}

const getInitials = (username) => {
  if (!username) return 'U'
  return username.charAt(0).toUpperCase()
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const today = new Date()
  
  const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear()
                  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  if (isToday) {
    return `Today at ${timeStr}`
  }
  
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${date.toLocaleDateString([], options)} at ${timeStr}`
}
</script>

<template>
  <div class="chat-area">
    <template v-if="!chatState.currentRoomId">
      <div class="empty-room-state">
        <div class="empty-room-card">
          <div class="welcome-banner">
            #
          </div>
          <h3>Choose a room</h3>
          <p>Select a room from the sidebar to load the conversation.</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="chat-header">
        <h2>
          <span class="hashtag">#</span>
          {{ chatState.currentRoom?.name || chatState.currentRoomId }}
        </h2>
        <div class="header-actions">
          <span
            v-if="chatState.isLoading"
            class="loading-indicator"
          >Loading messages...</span>
          <span
            v-else-if="chatState.isLoadingMore"
            class="loading-indicator"
          >Loading earlier messages...</span>
        </div>
      </div>

      <div
        ref="messagesContainer"
        class="messages-container"
        @scroll.passive="handleScroll"
      >
        <div
          v-if="chatState.messages.length === 0 && !chatState.isLoading"
          class="empty-state"
        >
          <div class="welcome-banner">
            #
          </div>
          <h3>No messages yet</h3>
          <p>Be the first to send a message in this room.</p>
        </div>

        <div
          v-else
          class="message-list"
        >
          <div
            v-for="message in chatState.messages"
            :key="message.id"
            :class="['message', { 'own-message': message.author_id === authState.user?.id }]"
          >
            <div
              class="message-avatar"
              :style="getAvatarStyle(message.author_username)"
            >
              {{ getInitials(message.author_username) }}
            </div>
            <div class="message-content">
              <div class="message-meta">
                <span class="sender">{{ message.author_username }}</span>
                <span class="timestamp">{{ formatTime(message.createdAt) }}</span>
              </div>
              <div class="message-text">
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg, #361134);
  min-height: 0;
  overflow: hidden;
}

.chat-header {
  height: 60px;
  min-height: 60px;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--input-border, #4a1447);
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(10px);
}

.chat-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main, #fff);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: lowercase;
}

.hashtag {
  color: var(--text-muted, #888);
  font-size: 1.5rem;
  font-weight: 300;
}

.loading-indicator {
  font-size: 0.85rem;
  color: var(--text-muted, #888);
  font-style: italic;
  animation: pulse 1.5s infinite;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
  scroll-behavior: smooth;
}

.empty-room-state {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.empty-room-card {
  max-width: 420px;
  width: 100%;
  text-align: center;
  padding: 2.5rem;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(36, 11, 35, 0.85), rgba(36, 11, 35, 0.55));
  border: 1px solid rgba(176, 34, 140, 0.18);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
}

/* Custom premium scrollbars */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(176, 34, 140, 0.15);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(176, 34, 140, 0.3);
}

.empty-state {
  margin: auto auto 2rem auto;
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  border-radius: 12px;
  background: rgba(36, 11, 35, 0.4);
  border: 1px solid rgba(74, 20, 71, 0.3);
}

.welcome-banner {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(176, 34, 140, 0.15);
  color: var(--primary, #B0228C);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 300;
  margin: 0 auto 1.5rem auto;
  border: 1px solid rgba(176, 34, 140, 0.3);
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  color: var(--text-main, #fff);
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-muted, #888);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.message {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: background-color 0.15s;
}

.message:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.own-message {
  background-color: rgba(176, 34, 140, 0.03);
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-meta {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.sender {
  font-weight: 600;
  color: var(--valid, #EA3788);
  font-size: 0.95rem;
}

.timestamp {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
}

.message-text {
  color: var(--text-main, #e0e0e0);
  line-height: 1.5;
  font-size: 0.95rem;
  word-wrap: break-word;
  white-space: pre-wrap;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
