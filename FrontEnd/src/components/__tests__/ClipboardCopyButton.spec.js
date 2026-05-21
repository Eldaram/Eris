import { mount } from '@vue/test-utils'
import ClipboardCopyButton from '../ClipboardCopyButton.vue'

describe('ClipboardCopyButton.vue', () => {
  beforeEach(() => {
    global.navigator.clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  })

  it('copies the provided text and shows copied state', async () => {
    const wrapper = mount(ClipboardCopyButton, {
      props: { text: 'https://example.com/invite/abc', label: 'Copy link' }
    })

    await wrapper.find('button').trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/invite/abc')
    expect(wrapper.emitted()).toHaveProperty('copied')
    expect(wrapper.text()).toContain('Copied')
  })
})