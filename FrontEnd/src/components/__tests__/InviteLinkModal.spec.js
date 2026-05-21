import { mount } from '@vue/test-utils'
import InviteLinkModal from '../InviteLinkModal.vue'

describe('InviteLinkModal.vue', () => {
  beforeEach(() => {
    global.navigator.clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  })

  it('shows the invite link and expiration date', () => {
    const wrapper = mount(InviteLinkModal, {
      props: {
        show: true,
        serverName: 'Sky Lounge',
        inviteUrl: 'https://frontend.test/invite/abc',
        expiresAt: '2026-05-22T12:00:00.000Z'
      },
      global: {
        stubs: { Teleport: true }
      }
    })

    expect(wrapper.text()).toContain('Sky Lounge')
    expect(wrapper.find('input#invite-link').element.value).toBe('https://frontend.test/invite/abc')
    expect(wrapper.text()).toContain('2026')
  })

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mount(InviteLinkModal, {
      props: {
        show: true,
        serverName: 'Sky Lounge',
        inviteUrl: 'https://frontend.test/invite/abc',
        expiresAt: '2026-05-22T12:00:00.000Z'
      },
      global: {
        stubs: { Teleport: true }
      }
    })

    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('close')
  })
})