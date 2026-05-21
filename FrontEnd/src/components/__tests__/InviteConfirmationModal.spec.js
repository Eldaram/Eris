import { mount } from '@vue/test-utils'
import InviteConfirmationModal from '../InviteConfirmationModal.vue'

describe('InviteConfirmationModal.vue', () => {
  it('renders the server name and emits actions', async () => {
    const wrapper = mount(InviteConfirmationModal, {
      props: {
        show: true,
        serverName: 'Sky Lounge',
        loading: false
      },
      global: {
        stubs: { Teleport: true }
      }
    })

    expect(wrapper.text()).toContain('Sky Lounge')

    await wrapper.find('.cancel-btn').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('close')

    await wrapper.find('.confirm-btn').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('confirm')
  })

  it('closes on backdrop click and close button', async () => {
    const wrapper = mount(InviteConfirmationModal, {
      props: {
        show: true,
        serverName: 'Sky Lounge',
        loading: false
      },
      global: {
        stubs: { Teleport: true }
      }
    })

    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()

    const wrapper2 = mount(InviteConfirmationModal, {
      props: {
        show: true,
        serverName: 'Sky Lounge',
        loading: false
      },
      global: {
        stubs: { Teleport: true }
      }
    })

    await wrapper2.find('.close-btn').trigger('click')
    expect(wrapper2.emitted('close')).toBeTruthy()
  })
})