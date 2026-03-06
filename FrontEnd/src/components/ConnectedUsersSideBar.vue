<script setup>
// Connected users side bar functionality
</script>

<template>
  <div class="connected-users-sidebar">
    <div class="users-group">
      <div class="group-title">ONLINE — 2</div>
      <div class="user-item">
        <div class="user-avatar">
          <div class="status-indicator online"></div>
        </div>
        <div class="user-name">Alice</div>
      </div>
      <div class="user-item">
        <div class="user-avatar">
          <div class="status-indicator dnd"></div>
        </div>
        <div class="user-name">Bob</div>
      </div>
    </div>
    
    <div class="users-group">
      <div class="group-title">OFFLINE — 1</div>
      <div class="user-item offline">
        <div class="user-avatar">
          <div class="status-indicator invisible"></div>
        </div>
        <div class="user-name">Charlie</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connected-users-sidebar {
  width: 240px;
  background-color: var(--bg-color, #3c123a);
  height: 100%;
  padding: 1.5rem 0.5rem;
  overflow-y: auto;
}

.users-group {
  margin-bottom: 2rem;
}

.group-title {
  color: var(--text-muted, #888);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.user-item:hover {
  background-color: var(--input-bg, #240b23);
  color: var(--text-main, #fff);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary, #B0228C);
  position: relative;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg-color, #3c123a);
}

.online { background-color: var(--valid, #10b981); }
.dnd { background-color: var(--invalid, #ef4444); }
.invisible { background-color: var(--text-muted, #888); border: 2px solid var(--text-muted, #888); background: var(--bg-color, #3c123a); }

.user-name {
  color: var(--text-main, #fff);
}

.user-item.offline .user-avatar {
  opacity: 0.5;
}

.user-item.offline .user-name {
  color: var(--text-muted, #888);
}
</style>
