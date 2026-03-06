<script setup>
// Chat area functionality
</script>

<template>
  <div class="chat-area">
    <div class="chat-header">
      <h2><span class="hashtag">#</span> general</h2>
      <div class="header-actions">
        <!-- Optional toolbar buttons -->
      </div>
    </div>
    
    <div class="messages-container">
      <div class="empty-state">
        <h3>Welcome to #general!</h3>
        <p>This is the beginning of the chat.</p>
      </div>
      
      <!-- Placeholder for messages -->
      <div class="message">
        <div class="message-avatar">E</div>
        <div class="message-content">
          <div class="message-meta">
            <span class="sender">ErisSystem</span>
            <span class="timestamp">Today at 12:00 PM</span>
          </div>
          <div class="message-text">
            System initialized. Waiting for users.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg, #361134);
  height: 100%;
}

.chat-header {
  height: 60px;
  min-height: 60px;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--input-border, #4a1447);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main, #fff);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hashtag {
  color: var(--text-muted, #888);
  font-size: 1.5rem;
  font-weight: 300;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.empty-state {
  margin-top: auto;
  margin-bottom: 2rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: var(--text-main, #fff);
}

.empty-state p {
  margin: 0;
  color: var(--text-muted, #888);
}

.message {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary, #B0228C);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.sender {
  font-weight: 600;
  color: var(--valid, #EA3788);
}

.timestamp {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
}

.message-text {
  color: var(--text-main, #fff);
  line-height: 1.4;
}
</style>
