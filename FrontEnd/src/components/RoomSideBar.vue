<script setup>
// Empty for now, will hold room list later
</script>

<template>
  <div class="room-sidebar">
    <div class="sidebar-header">
      <h2>Rooms</h2>
    </div>
    <div class="room-list">
      <div class="room-item">
        <span class="hashtag">#</span> general
      </div>
      <div class="room-item empty-state">
        <span class="text">No other rooms</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-sidebar {
  width: 240px;
  background-color: var(--bg-color, #3c123a);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--input-border, #4a1447);
  color: var(--text-main, #fff);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.room-list {
  flex: 1;
  padding: 0.5rem 0;
  overflow-y: auto;
}

.room-item {
  padding: 0.5rem 1rem;
  margin: 0.1rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted, #888);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s, color 0.2s;
}

.room-item:hover {
  background-color: var(--input-bg, #240b23);
  color: var(--text-main, #fff);
}

.hashtag {
  font-size: 1.2rem;
  color: var(--text-muted, #888);
}

.empty-state {
  cursor: default;
  font-style: italic;
}
.empty-state:hover {
  background-color: transparent;
  color: var(--text-muted, #888);
}
</style>
