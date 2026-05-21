import { vi, describe, it, expect, beforeEach } from 'vitest'
import { serverService } from '../server'
import { authService } from '../auth'

vi.mock('../auth', () => ({
  authService: {
    getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer test-token' }))
  }
}))

describe('serverService invite methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an invite with auth headers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ inviteUrl: 'http://frontend.test/invite/abc', expiresAt: '2026-05-22T12:00:00.000Z', code: 'abc' })
    })

    const result = await serverService.createInvite('server-1')

    expect(authService.getAuthHeader).toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/servers/server-1/invites'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
      })
    )
    expect(result.inviteUrl).toContain('/invite/abc')
  })

  it('loads invite preview', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ serverName: 'Preview Server', alreadyMember: false })
    })

    const result = await serverService.getInvitePreview('invite-code')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/invites/invite-code'),
      expect.objectContaining({ method: 'GET' })
    )
    expect(result.serverName).toBe('Preview Server')
    expect(result.alreadyMember).toBe(false)
  })

  it('redeems an invite', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ serverId: 'server-1', joined: true, alreadyMember: false })
    })

    const result = await serverService.redeemInvite('invite-code')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/invites/invite-code/redeem'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.serverId).toBe('server-1')
    expect(result.joined).toBe(true)
  })

  it('checks server ownership', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ isOwner: true })
    })

    const result = await serverService.isServerOwner('server-1')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/servers/server-1/ownership'),
      expect.objectContaining({ method: 'GET' })
    )
    expect(result.isOwner).toBe(true)
  })

  it('creates a room in a server', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, room: { id: 'room-1', name: 'announcements', serverId: 'server-1' } })
    })

    const result = await serverService.createRoom('server-1', 'announcements')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/servers/server-1/rooms'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'announcements' })
      })
    )
    expect(result.room.name).toBe('announcements')
  })
})