<script setup>
// Empty for now, will hold server list later
</script>

<template>
  <div class="server-sidebar">
    <div class="server-item empty-state">
      <span>+</span>
    </div>
  </div>
</template>

<style scoped>
.server-sidebar {
  width: 72px;
  background-color: var(--card-bg, #361134);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 1rem;
  border-right: 1px solid var(--input-border, #4a1447);
  overflow-y: auto;
}

.server-item {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--input-bg, #240b23);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: border-radius 0.2s, background-color 0.2s;
  color: var(--text-main, #fff);
  font-weight: bold;
}

.server-item:hover {
  border-radius: 30%;
  background-color: var(--primary, #B0228C);
}

.empty-state {
  border: 2px dashed var(--text-muted, #888);
  background: transparent;
  color: var(--text-muted, #888);
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
}

.empty-state span {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -4px; /* Slightly adjust the visual center of standard + character */
}

.empty-state:hover {
  border-color: var(--primary, #B0228C);
  color: var(--text-main, #fff);
  background: transparent;
}
</style>
