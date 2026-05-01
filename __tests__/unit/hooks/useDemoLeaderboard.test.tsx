import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDemoLeaderboard } from '@/hooks/useDemoLeaderboard'
import { getPusherClient, EVENTS } from '@/lib/pusher.client'

vi.mock('@/lib/pusher.client', () => ({
  CHANNEL: 'demo-leaderboard',
  EVENTS: {
    PLAYER_JOINED: 'player-joined',
    LEVEL_UPDATE: 'level-update',
    PLAYER_LEFT: 'player-left',
    CHAMPION_ACHIEVED: 'champion-achieved',
  },
  getPusherClient: vi.fn(),
}))

describe('useDemoLeaderboard', () => {
  const originalFetch = global.fetch

  const mockPlayers = [
    { playerId: 'player-1', displayName: 'Player1', level: 3 },
    { playerId: 'player-2', displayName: 'Player2', level: 5 },
    { playerId: 'player-3', displayName: 'Player3', level: 1 },
  ]

  const channel = {
    bind: vi.fn(),
    unbind: vi.fn(),
  }

  const connection = {
    state: 'disconnected',
    bind: vi.fn(),
    unbind: vi.fn(),
  }

  const pusher = {
    subscribe: vi.fn(() => channel),
    unsubscribe: vi.fn(),
    connection,
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        players: mockPlayers,
        total: mockPlayers.length,
      }),
    })

    channel.bind.mockClear()
    channel.unbind.mockClear()
    connection.bind.mockClear()
    connection.unbind.mockClear()
    connection.state = 'disconnected'
    pusher.subscribe.mockClear()
    pusher.unsubscribe.mockClear()
    vi.mocked(getPusherClient).mockReturnValue(pusher as never)
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('starts with loading true and no players', () => {
    const { result } = renderHook(() => useDemoLeaderboard())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.players).toEqual([])
    expect(result.current.isLive).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches leaderboard on mount', async () => {
    renderHook(() => useDemoLeaderboard())

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/demo/leaderboard')
    })
  })

  it('sets players after fetch', async () => {
    const { result } = renderHook(() => useDemoLeaderboard())

    await waitFor(() => {
      expect(result.current.players).toEqual(mockPlayers)
    })
  })

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDemoLeaderboard())

    await waitFor(() => {
      expect(result.current.error).toContain('Network error')
    })
  })

  it('refetches data when refresh is called', async () => {
    const { result } = renderHook(() => useDemoLeaderboard())

    await waitFor(() => {
      expect(result.current.players.length).toBeGreaterThan(0)
    })

    const newPlayers = [{ playerId: 'new-player', displayName: 'New', level: 5 }]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ players: newPlayers, total: 1 }),
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.players).toEqual(newPlayers)
  })

  it('subscribes to Pusher leaderboard events', async () => {
    renderHook(() => useDemoLeaderboard())

    await waitFor(() => {
      expect(pusher.subscribe).toHaveBeenCalledWith('demo-leaderboard')
    })

    expect(channel.bind).toHaveBeenCalledWith(EVENTS.PLAYER_JOINED, expect.any(Function))
    expect(channel.bind).toHaveBeenCalledWith(EVENTS.LEVEL_UPDATE, expect.any(Function))
    expect(channel.bind).toHaveBeenCalledWith(EVENTS.PLAYER_LEFT, expect.any(Function))
    expect(channel.bind).toHaveBeenCalledWith(EVENTS.CHAMPION_ACHIEVED, expect.any(Function))
  })

  it('reflects connected Pusher state', async () => {
    connection.state = 'connected'

    const { result } = renderHook(() => useDemoLeaderboard())

    await waitFor(() => {
      expect(result.current.isLive).toBe(true)
    })
  })

  it('polls when Pusher is unavailable', async () => {
    vi.mocked(getPusherClient).mockReturnValue(null)

    renderHook(() => useDemoLeaderboard({ pollInterval: 1000 }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('does not fetch when disabled', async () => {
    renderHook(() => useDemoLeaderboard({ enabled: false }))

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(pusher.subscribe).not.toHaveBeenCalled()
  })
})
