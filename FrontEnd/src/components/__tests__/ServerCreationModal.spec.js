import { mount } from '@vue/test-utils'
import ServerCreationModal from '../ServerCreationModal.vue'
import { serverService } from '../../services/server'

// Mock the serverService
vi.mock('../../services/server', () => ({
    serverService: {
        createServer: vi.fn()
    }
}))

describe('ServerCreationModal.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock Teleport to just render content in-place for testing
        // Note: In some test setups, Teleport might need a stub or a target in document.body
    })

    it('renders correctly when show is true', () => {
        const wrapper = mount(ServerCreationModal, {
            props: { show: true },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        expect(wrapper.find('h2').text()).toBe('Create a Server')
        expect(wrapper.find('input#server-name').exists()).toBe(true)
        expect(wrapper.find('button.create-btn').text()).toBe('Create')
    })

    it('does not render when show is false', () => {
        const wrapper = mount(ServerCreationModal, {
            props: { show: false },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('updates v-model when typing', async () => {
        const wrapper = mount(ServerCreationModal, {
            props: { show: true },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        const input = wrapper.find('input#server-name')
        await input.setValue('My New Server')
        expect(input.element.value).toBe('My New Server')
    })

    it('disables create button when name is empty', async () => {
        const wrapper = mount(ServerCreationModal, {
            props: { show: true },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        const createBtn = wrapper.find('button.create-btn')
        expect(createBtn.element.disabled).toBe(true)

        await wrapper.find('input#server-name').setValue('   ')
        expect(createBtn.element.disabled).toBe(true)
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = mount(ServerCreationModal, {
            props: { show: true },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        await wrapper.find('button.cancel-btn').trigger('click')
        expect(wrapper.emitted()).toHaveProperty('close')
    })

    it('calls serverService and emits created on success', async () => {
        const mockResult = { id: 'uuid-123', name: 'Success Server' }
        serverService.createServer.mockResolvedValueOnce(mockResult)

        const wrapper = mount(ServerCreationModal, {
            props: { show: true },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        await wrapper.find('input#server-name').setValue('Success Server')
        await wrapper.find('button.create-btn').trigger('click')

        expect(serverService.createServer).toHaveBeenCalledWith('Success Server')

        // Wait for the async call to flush
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.emitted()).toHaveProperty('created')
        expect(wrapper.emitted().created[0][0]).toEqual(mockResult)
        expect(wrapper.emitted()).toHaveProperty('close')
    })

    it('emits error when serverService fails', async () => {
        const errorMessage = 'Server name already exists'
        serverService.createServer.mockRejectedValueOnce(new Error(errorMessage))

        const wrapper = mount(ServerCreationModal, {
            props: { show: true },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        })

        await wrapper.find('input#server-name').setValue('Fail Server')
        await wrapper.find('button.create-btn').trigger('click')

        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.emitted()).toHaveProperty('error')
        expect(wrapper.emitted().error[0][0]).toBe(errorMessage)
        expect(wrapper.find('button.create-btn').element.disabled).toBe(false)
    })
})
