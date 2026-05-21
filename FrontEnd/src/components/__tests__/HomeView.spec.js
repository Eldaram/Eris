import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from '../../views/HomeView.vue'
import { serverService } from '../../services/server'
import { chatService } from '../../services/chat'
import { socketService } from '../../services/socket'
import { authState } from '../../services/auth'

vi.mock('../../services/server', () => ({
    serverService: {
        listServers: vi.fn().mockResolvedValue([{ id: 'server-1', name: 'Preview Server' }]),
        getChannels: vi.fn().mockResolvedValue([]),
        getInvitePreview: vi.fn(),
        redeemInvite: vi.fn(),
        createInvite: vi.fn()
    }
}))

vi.mock('../../services/chat', () => ({
    chatService: {
        init: vi.fn()
    }
}))

vi.mock('../../services/socket', () => ({
    socketService: {
        disconnect: vi.fn()
    }
}))

vi.mock('../../services/auth', () => ({
    authState: {
        user: { id: 'user-1', username: 'Alice' },
        token: 'token-1',
        isAuthenticated: true,
        isInitialized: true
    }
}))

const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
        { path: '/invite/:code', name: 'invite', component: HomeView, meta: { requiresAuth: true } }
    ]
})

describe('HomeView invite flow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.user = { id: 'user-1', username: 'Alice' }
        authState.token = 'token-1'
        authState.isAuthenticated = true
    })

    const mountHome = async (path) => {
        await router.push(path)
        await router.isReady()

        return mount(HomeView, {
            global: {
                plugins: [router],
                stubs: {
                    Teleport: true,
                    NotificationCard: true,
                    ChatArea: true,
                    MessageInput: true,
                    ConnectedUsersSideBar: true,
                    UserProfileCard: true
                }
            }
        })
    }

    it('opens the confirmation popup for invite links that require confirmation', async () => {
        serverService.getInvitePreview.mockResolvedValueOnce({
            serverName: 'Preview Server',
            alreadyMember: false
        })
        serverService.redeemInvite.mockResolvedValueOnce({
            serverId: 'server-1',
            joined: true,
            alreadyMember: false
        })

        const wrapper = await mountHome('/invite/invite-token')
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(serverService.getInvitePreview).toHaveBeenCalledWith('invite-token')
        expect(wrapper.findComponent({ name: 'InviteConfirmationModal' }).props('show')).toBe(true)

        await wrapper.findComponent({ name: 'InviteConfirmationModal' }).find('.confirm-btn').trigger('click')
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(serverService.redeemInvite).toHaveBeenCalledWith('invite-token')
        expect(router.currentRoute.value.path).toBe('/')
    })

    it('auto-joins invite links when the user is already a member', async () => {
        serverService.getInvitePreview.mockResolvedValueOnce({
            serverName: 'Preview Server',
            alreadyMember: true
        })
        serverService.redeemInvite.mockResolvedValueOnce({
            serverId: 'server-1',
            joined: false,
            alreadyMember: true
        })

        const wrapper = await mountHome('/invite/invite-token')
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(serverService.getInvitePreview).toHaveBeenCalledWith('invite-token')
        expect(serverService.redeemInvite).toHaveBeenCalledWith('invite-token')
        expect(wrapper.findComponent({ name: 'InviteConfirmationModal' }).props('show')).toBe(false)
        expect(router.currentRoute.value.path).toBe('/')
    })
})