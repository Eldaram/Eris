<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chatService } from '../services/chat'
import { socketService } from '../services/socket'
import { authState } from '../services/auth'
import { serverService } from '../services/server'
import ServerSideBar from '../components/ServerSideBar.vue'
import RoomSideBar from '../components/RoomSideBar.vue'
import UserProfileCard from '../components/UserProfileCard.vue'
import ChatArea from '../components/ChatArea.vue'
import MessageInput from '../components/MessageInput.vue'
import ConnectedUsersSideBar from '../components/ConnectedUsersSideBar.vue'
import NotificationCard from '../components/NotificationCard.vue'
import InviteConfirmationModal from '../components/InviteConfirmationModal.vue'
import InviteLinkModal from '../components/InviteLinkModal.vue'

const route = useRoute()
const router = useRouter()
const serverSidebarRef = ref(null)

const notification = ref({
  show: false,
  message: '',
  type: 'error'
})

const selectedServer = ref(null)
const inviteState = ref({
  showConfirmation: false,
  showInviteLink: false,
  loadingPreview: false,
  loadingJoin: false,
  serverName: '',
  inviteUrl: '',
  expiresAt: '',
  code: ''
})

const handleServerError = (errorMsg) => {
  notification.value = {
    show: true,
    message: errorMsg,
    type: 'error'
  }
}

const closeNotification = () => {
  notification.value.show = false
}

const clearInviteState = () => {
  inviteState.value = {
    showConfirmation: false,
    showInviteLink: false,
    loadingPreview: false,
    loadingJoin: false,
    serverName: '',
    inviteUrl: '',
    expiresAt: '',
    code: ''
  }
}

const openServerById = async (serverId) => {
  await serverSidebarRef.value?.reloadServers?.()
  serverSidebarRef.value?.selectServerById?.(serverId)
}

const handleInviteError = (error) => {
  handleServerError(error?.message || 'Failed to join server from invite')
  router.replace({ name: 'home' })
  clearInviteState()
}

const joinInviteAndOpenServer = async (code) => {
  inviteState.value.loadingJoin = true
  try {
    const result = await serverService.redeemInvite(code)
    await openServerById(result.serverId)
    router.replace({ name: 'home' })
    clearInviteState()
  } catch (error) {
    handleInviteError(error)
  } finally {
    inviteState.value.loadingJoin = false
  }
}

const loadInvitePreview = async (code) => {
  if (!code) return

  inviteState.value.loadingPreview = true
  inviteState.value.code = code

  try {
    const preview = await serverService.getInvitePreview(code)
    inviteState.value.serverName = preview.serverName

    if (preview.alreadyMember) {
      await joinInviteAndOpenServer(code)
      return
    }

    inviteState.value.showConfirmation = true
  } catch (error) {
    handleInviteError(error)
  } finally {
    inviteState.value.loadingPreview = false
  }
}

const handleInviteConfirm = async () => {
  if (!inviteState.value.code) return
  inviteState.value.showConfirmation = false
  await joinInviteAndOpenServer(inviteState.value.code)
}

const handleInviteClose = () => {
  inviteState.value.showConfirmation = false
  router.replace({ name: 'home' })
  clearInviteState()
}

const handleCreateInvite = async () => {
  if (!selectedServer.value?.id) return

  try {
    const invite = await serverService.createInvite(selectedServer.value.id)
    inviteState.value.inviteUrl = invite.inviteUrl
    inviteState.value.expiresAt = invite.expiresAt
    inviteState.value.serverName = selectedServer.value.name
    inviteState.value.showInviteLink = true
  } catch (error) {
    handleServerError(error.message || 'Failed to create invite link')
  }
}

const handleInviteLinkClose = () => {
  inviteState.value.showInviteLink = false
  inviteState.value.inviteUrl = ''
  inviteState.value.expiresAt = ''
}

watch(
  () => route.params.code,
  (code) => {
    if (typeof code === 'string' && code.trim()) {
      loadInvitePreview(code.trim())
    } else {
      clearInviteState()
    }
  },
  { immediate: true }
)

// Initialize real-time chat service connection
onMounted(() => {
  chatService.init()
})

// Clean up WebSocket connection when leaving
onUnmounted(() => {
  socketService.disconnect()
})
</script>

<template>
  <div class="home-layout">
    <div class="navigation-panel">
      <div class="sidebars-container">
        <ServerSideBar ref="serverSidebarRef" @server-error="handleServerError" @server-selected="selectedServer = $event" />
        <div class="rooms-column">
          <RoomSideBar :selectedServer="selectedServer" @create-invite="handleCreateInvite" />
        </div>
      </div>
      <UserProfileCard :username="authState.user?.username || 'Current User'" status="Online" />
    </div>
    
    <div class="chat-column">
      <ChatArea />
      <MessageInput />
    </div>
    
    <ConnectedUsersSideBar />

    <NotificationCard
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
      :visible="notification.show"
      @close="closeNotification"
    />

    <InviteConfirmationModal
      :show="inviteState.showConfirmation"
      :serverName="inviteState.serverName"
      :loading="inviteState.loadingJoin || inviteState.loadingPreview"
      @close="handleInviteClose"
      @confirm="handleInviteConfirm"
    />

    <InviteLinkModal
      :show="inviteState.showInviteLink"
      :serverName="inviteState.serverName"
      :inviteUrl="inviteState.inviteUrl"
      :expiresAt="inviteState.expiresAt"
      @close="handleInviteLinkClose"
    />
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-color, #3c123a);
}

.navigation-panel {
  display: flex;
  flex-direction: column;
  width: 312px; /* 72px server + 240px rooms */
  background-color: var(--bg-color, #3c123a);
  border-right: 1px solid var(--input-border, #4a1447);
}

.sidebars-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.rooms-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: var(--bg-color, #3c123a);
}

/* RoomSideBar takes available space */
.rooms-column :deep(.room-sidebar) {
  flex: 1;
  overflow-y: auto;
}

.chat-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: var(--card-bg, #361134);
  min-width: 0; /* Important for flex children to allow shrinking below min-content */
}
</style>
