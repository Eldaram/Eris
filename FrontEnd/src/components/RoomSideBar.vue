<script setup>
import { ref, watch } from 'vue'
import { serverService } from '../services/server'

const props = defineProps({
  selectedServer: {
    type: Object,
    required: false,
  }
})

const channels = ref([])
const loading = ref(false)
const error = ref(null)

watch(() => props.selectedServer, async (newServer) => {
  channels.value = []
  error.value = null
  if (!newServer || !newServer.id) return
  loading.value = true
  try {
    channels.value = await serverService.getChannels(newServer.id)
  } catch (err) {
    error.value = err.message || 'Failed to load channels'
  } finally {
    loading.value = false
  }
})

const emit = defineEmits(['create-invite'])
</script>

<template>
  <div class="room-sidebar">
    <div class="sidebar-header">
      <h2>
        <span>{{ props.selectedServer?.name || 'Rooms' }}</span>
        <button
          v-if="props.selectedServer"
          class="invite-btn"
          type="button"
          aria-label="Create server invite"
          title="Create invite"
          @click="emit('create-invite')"
        >
          ⤴
        </button>
      </h2>
    </div>
    <div class="room-list">
      <!-- If no server selected, show default static sidebar -->
      <template v-if="!props.selectedServer">
        <div class="room-item">
          <span class="hashtag">#</span> general
        </div>
        <div class="room-item empty-state">
          <span class="text">No other rooms</span>
        </div>
      </template>

      <!-- When a server is selected, show channels fetched from API -->
      <template v-else>
        <div v-if="loading" class="room-item">Loading...</div>
        <div v-else>
          <div v-if="channels.length === 0" class="room-item empty-state">
            <span class="text">No rooms</span>
          </div>
          <div v-for="ch in channels" :key="ch.id" class="room-item">
            <span class="hashtag">#</span> {{ ch.name }}
          </div>
        </div>
        <div v-if="error" class="room-item">{{ error }}</div>
      </template>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.invite-btn {
  border: 1px solid var(--input-border, #4a1447);
  background: var(--input-bg, #240b23);
  color: var(--text-main, #fff);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.invite-btn:hover {
  border-color: var(--primary, #B0228C);
  transform: translateY(-1px);
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
