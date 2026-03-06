<script setup>
// Props or state can be added later to receive the actual user's details.
defineProps({
  username: {
    type: String,
    default: 'Current User'
  },
  status: {
    type: String,
    default: 'Online' // online, dnd, idle, invisible
  }
})
</script>

<template>
  <div class="user-profile-card">
    <div class="avatar-container">
      <div class="avatar">
        {{ username.charAt(0).toUpperCase() }}
      </div>
      <div class="status-indicator" :class="status.toLowerCase()"></div>
    </div>
    <div class="user-info">
      <div class="username">{{ username }}</div>
      <div class="status-text">{{ status }}</div>
    </div>
  </div>
</template>

<style scoped>
.user-profile-card {
  height: 60px;
  background-color: var(--input-bg, #240b23);
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  border-top: 1px solid var(--input-border, #4a1447);
  flex-shrink: 0;
}

.avatar-container {
  position: relative;
  margin-right: 0.5rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary, #B0228C);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.status-indicator {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--input-bg, #240b23);
}

.online { background-color: var(--valid, #10b981); }
.dnd { background-color: var(--invalid, #ef4444); }
.idle { background-color: #f59e0b; }
.invisible { background-color: var(--text-muted, #888); }

.user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.username {
  color: var(--text-main, #fff);
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.2;
}

.status-text {
  color: var(--text-muted, #888);
  font-size: 0.75rem;
  line-height: 1.2;
}
</style>
