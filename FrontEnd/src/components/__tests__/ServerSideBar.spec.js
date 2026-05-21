import { mount } from '@vue/test-utils'
import ServerSideBar from '../ServerSideBar.vue'
import { serverService } from '../../services/server'

vi.mock('../../services/server', () => ({
    serverService: {
        listServers: vi.fn().mockResolvedValue([])
    }
}))

describe('ServerSideBar.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', async () => {
        const wrapper = mount(ServerSideBar)
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(wrapper.classes()).toContain('server-sidebar')
        expect(wrapper.find('.server-item.empty-state').exists()).toBe(true)
    })

    it('exposes methods for reloading and selecting servers by id', async () => {
        const wrapper = mount(ServerSideBar)
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(typeof wrapper.vm.reloadServers).toBe('function')
        expect(typeof wrapper.vm.selectServerById).toBe('function')
    })

    it('auto-selects the first server with the full server object', async () => {
        serverService.listServers.mockResolvedValueOnce([
            { id: 'server-1', name: 'First Server' },
            { id: 'server-2', name: 'Second Server' }
        ])

        const wrapper = mount(ServerSideBar)
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.emitted('server-selected')?.[0]?.[0]).toEqual({
            id: 'server-1',
            name: 'First Server'
        })
    })
})
