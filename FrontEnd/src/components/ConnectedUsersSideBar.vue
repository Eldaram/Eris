<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { authState } from "../services/auth";
import { serverService } from "../services/server";
import { socketService } from "../services/socket";

const props = defineProps({
  selectedServer: {
    type: Object,
    default: null,
  },
});

const members = ref([]);
const loading = ref(false);
const error = ref(null);
const requestSequence = ref(0);

const selectedServerId = computed(() => props.selectedServer?.id || null);
const onlineMembers = computed(() =>
  members.value.filter((member) => member.isOnline),
);
const offlineMembers = computed(() =>
  members.value.filter((member) => !member.isOnline),
);
const totalMembers = computed(() => members.value.length);

const sortMembers = (items) => {
  return [...items].sort((left, right) => {
    if (left.isOnline !== right.isOnline) {
      return left.isOnline ? -1 : 1;
    }

    return left.username.localeCompare(right.username);
  });
};

const normalizeMember = (member) => ({
  id: member.id,
  username: member.username,
  isOnline: Boolean(member.isOnline),
});

const loadMembers = async (serverId) => {
  if (!serverId) {
    members.value = [];
    error.value = null;
    loading.value = false;
    return;
  }

  const currentRequest = ++requestSequence.value;
  loading.value = true;
  error.value = null;

  try {
    const users = await serverService.getServerUsers(serverId);

    if (currentRequest !== requestSequence.value) {
      return;
    }

    members.value = sortMembers(users.map(normalizeMember));
  } catch (err) {
    if (currentRequest !== requestSequence.value) {
      return;
    }

    error.value = err?.message || "Failed to load connected users";
    members.value = [];
  } finally {
    if (currentRequest === requestSequence.value) {
      loading.value = false;
    }
  }
};

const handlePresenceChange = async (notification) => {
  if (
    !notification?.serverId ||
    notification.serverId !== selectedServerId.value
  ) {
    return;
  }

  const index = members.value.findIndex(
    (member) => member.id === notification.userId,
  );
  if (index === -1) {
    await loadMembers(notification.serverId);
    return;
  }

  const nextMembers = [...members.value];
  nextMembers[index] = {
    ...nextMembers[index],
    isOnline: Boolean(notification.isOnline),
  };

  members.value = sortMembers(nextMembers);
};

const currentUserId = computed(() => authState.user?.id || null);

watch(
  selectedServerId,
  (serverId) => {
    loadMembers(serverId);
  },
  { immediate: true },
);

onMounted(() => {
  socketService.on("server:user-presence-changed", handlePresenceChange);
});

onBeforeUnmount(() => {
  socketService.off("server:user-presence-changed", handlePresenceChange);
});
</script>

<template>
  <div class="connected-users-sidebar">
    <div class="sidebar-header">
      <div class="title-row">
        <h2>Connected Users</h2>
        <span class="member-count">{{ totalMembers }}</span>
      </div>
      <p class="subtitle">
        {{ selectedServer?.name || "Select a server to see its members" }}
      </p>
    </div>

    <div v-if="!selectedServerId" class="empty-state">
      Choose a server to see who is online.
    </div>

    <div v-else-if="loading" class="empty-state">Loading members...</div>

    <div v-else-if="error" class="empty-state error-state">
      {{ error }}
    </div>

    <template v-else>
      <div class="users-group">
        <div class="group-title">ONLINE — {{ onlineMembers.length }}</div>
        <div v-if="onlineMembers.length === 0" class="group-empty">
          No users online right now.
        </div>
        <div v-for="user in onlineMembers" :key="user.id" class="user-item">
          <div class="user-avatar">
            <div class="status-indicator online" />
            <span>{{ user.username.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="user-meta">
            <div class="user-name-row">
              <span class="user-name">{{ user.username }}</span>
              <span v-if="user.id === currentUserId" class="me-badge">
                You
              </span>
            </div>
            <div class="user-status">Online</div>
          </div>
        </div>
      </div>

      <div class="users-group">
        <div class="group-title">OFFLINE — {{ offlineMembers.length }}</div>
        <div v-if="offlineMembers.length === 0" class="group-empty">
          Everyone is online.
        </div>
        <div
          v-for="user in offlineMembers"
          :key="user.id"
          class="user-item offline"
        >
          <div class="user-avatar">
            <div class="status-indicator invisible" />
            <span>{{ user.username.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="user-meta">
            <div class="user-name-row">
              <span class="user-name">{{ user.username }}</span>
              <span v-if="user.id === currentUserId" class="me-badge">
                You
              </span>
            </div>
            <div class="user-status">Offline</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.connected-users-sidebar {
  width: 240px;
  background:
    radial-gradient(circle at top, rgba(176, 34, 140, 0.18), transparent 35%),
    linear-gradient(180deg, rgba(60, 18, 58, 0.98), rgba(36, 11, 35, 0.98));
  height: 100%;
  padding: 1rem 0.5rem 1.25rem;
  overflow-y: auto;
}

.sidebar-header {
  padding: 0.5rem 0.75rem 1rem;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main, #fff);
  letter-spacing: 0.02em;
}

.member-count {
  min-width: 2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(176, 34, 140, 0.16);
  color: var(--text-main, #fff);
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted, #888);
  font-size: 0.8rem;
  line-height: 1.4;
}

.users-group {
  margin-bottom: 1.5rem;
}

.group-title {
  color: var(--text-muted, #a79ca7);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 0.75rem;
  margin-bottom: 0.5rem;
  letter-spacing: 0.08em;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  margin: 0 0.35rem;
  border-radius: 12px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.2s,
    color 0.2s;
}

.user-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: var(--text-main, #fff);
  transform: translateX(2px);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(176, 34, 140, 0.92),
    rgba(204, 92, 177, 0.92)
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.88rem;
  font-weight: 700;
  position: relative;
  flex-shrink: 0;
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

.online {
  background-color: var(--valid, #10b981);
}
.invisible {
  background-color: var(--text-muted, #888);
  border: 2px solid var(--text-muted, #888);
  background: var(--bg-color, #3c123a);
}

.user-meta {
  min-width: 0;
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.user-name {
  color: var(--text-main, #fff);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-status {
  color: var(--text-muted, #a79ca7);
  font-size: 0.75rem;
  margin-top: 0.15rem;
}

.me-badge {
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main, #fff);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.user-item.offline .user-avatar {
  opacity: 0.5;
}

.user-item.offline .user-name {
  color: var(--text-muted, #888);
}

.group-empty,
.empty-state {
  margin: 0 0.75rem 1rem;
  padding: 0.85rem 0.9rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted, #a79ca7);
  font-size: 0.85rem;
  line-height: 1.4;
}

.error-state {
  color: #fca5a5;
}
</style>
