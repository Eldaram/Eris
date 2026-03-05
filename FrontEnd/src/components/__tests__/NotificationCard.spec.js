import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationCard from '../NotificationCard.vue'

describe('NotificationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders error notification correctly', () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'An error occurred',
        type: 'error',
        visible: true
      }
    })

    expect(wrapper.text()).toContain('An error occurred')
    expect(wrapper.find('.notification-card').classes()).toContain('error')
    expect(wrapper.find('.notification-icon span').text()).toBe('✕')
  })

  it('renders success notification correctly', () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'Operation successful',
        type: 'success',
        visible: true
      }
    })

    expect(wrapper.text()).toContain('Operation successful')
    expect(wrapper.find('.notification-card').classes()).toContain('success')
    expect(wrapper.find('.notification-icon span').text()).toBe('✓')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'Test message',
        type: 'error',
        visible: true
      }
    })

    await wrapper.find('.notification-close').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('close')
  })

  it('auto-closes after 4 seconds', async () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'Test message',
        type: 'success',
        visible: true
      }
    })

    expect(wrapper.emitted('close')).toBeFalsy()
    
    vi.advanceTimersByTime(4000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted()).toHaveProperty('close')
  })

  it('does not auto-close when hovered', async () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'Test message',
        type: 'success',
        visible: true
      }
    })

    // Simulate mouse enter
    await wrapper.find('.notification-card').trigger('mouseenter')
    
    vi.advanceTimersByTime(4000)
    await wrapper.vm.$nextTick()
    
    // Should not have emitted close
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('starts timer when mouse leaves after hovering', async () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'Test message',
        type: 'success',
        visible: true
      }
    })

    // Simulate mouse enter then leave
    await wrapper.find('.notification-card').trigger('mouseenter')
    await wrapper.find('.notification-card').trigger('mouseleave')
    
    vi.advanceTimersByTime(4000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted()).toHaveProperty('close')
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(NotificationCard, {
      props: {
        message: 'Test message',
        type: 'error',
        visible: false
      }
    })

    expect(wrapper.find('.notification-card').exists()).toBe(false)
  })
})
