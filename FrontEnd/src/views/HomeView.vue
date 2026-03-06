<script setup>
import { ref } from 'vue'
import ServerSideBar from '../components/ServerSideBar.vue'
import RoomSideBar from '../components/RoomSideBar.vue'
import UserProfileCard from '../components/UserProfileCard.vue'
import ChatArea from '../components/ChatArea.vue'
import MessageInput from '../components/MessageInput.vue'
import ConnectedUsersSideBar from '../components/ConnectedUsersSideBar.vue'
import NotificationCard from '../components/NotificationCard.vue'

const notification = ref({
  show: false,
  message: '',
  type: 'error'
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
</script>

<template>
  <div class="home-layout">
    <div class="navigation-panel">
      <div class="sidebars-container">
        <ServerSideBar @server-error="handleServerError" />
        <div class="rooms-column">
          <RoomSideBar />
        </div>
      </div>
      <UserProfileCard username="Current User" status="Online" />
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
