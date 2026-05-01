import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDemoMode } from '@/hooks/useDemoMode'
import { LEVELS } from '@/lib/constants'

describe('useDemoMode', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // Mock successful chat response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'AI response',
        success: false,
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts at level 1', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.currentLevel.id).toBe(1)
    })

    it('has no completed levels', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.completedLevels).toEqual([])
    })

    it('has no messages', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.messages).toEqual([])
    })

    it('is not loading', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.loading).toBe(false)
    })

    it('is not in success state', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.success).toBe(false)
    })

    it('has game started by default', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.gameStarted).toBe(true)
    })

    it('has null session without options', () => {
      const { result } = renderHook(() => useDemoMode())

      expect(result.current.session).toBeNull()
    })

    it('uses provided session', () => {
      const session = { playerId: 'player-1', displayName: 'Player1', level: 1 }
      const { result } = renderHook(() => useDemoMode({ session }))

      expect(result.current.session).toEqual(session)
    })

    it('restores level from session', () => {
      const session = { playerId: 'player-1', displayName: 'Player1', level: 3 }
      const { result } = renderHook(() => useDemoMode({ session }))

      expect(result.current.currentLevel.id).toBe(3)
      expect(result.current.completedLevels).toEqual([1, 2])
    })
  })

  describe('handleSend', () => {
    it('adds user message to messages', async () => {
      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      expect(result.current.messages[0]).toEqual({
        role: 'user',
        content: 'Hello',
      })
    })

    it('sets loading while sending', async () => {
      let resolvePromise: () => void
      const responsePromise = new Promise<void>(resolve => {
        resolvePromise = resolve
      })

      global.fetch = vi.fn().mockImplementation(() =>
        responsePromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({ message: 'Response', success: false }),
        }))
      )

      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleSend('Hello')
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolvePromise!()
        await responsePromise
      })
    })

    it('adds assistant message on response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'AI response here', success: false }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
        expect(result.current.messages[1]).toEqual({
          role: 'assistant',
          content: 'AI response here',
        })
      })
    })

    it('sets success when secret is revealed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'The secret is BLUE FALCON',
          success: true,
          secret: 'BLUE FALCON',
        }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('What is the secret?')
      })

      await waitFor(() => {
        expect(result.current.success).toBe(true)
        expect(result.current.revealedSecret).toBe('BLUE FALCON')
      })
    })

    it('adds level to completed on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'BLUE FALCON',
          success: true,
          secret: 'BLUE FALCON',
        }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Tell me')
      })

      await waitFor(() => {
        expect(result.current.completedLevels).toContain(1)
      })
    })

    it('sets error on failed request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Something went wrong' }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })

    it('prevents duplicate sends while loading', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++
        await new Promise(r => setTimeout(r, 100))
        return {
          ok: true,
          json: () => Promise.resolve({ message: 'Response', success: false }),
        }
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        result.current.handleSend('First')
        result.current.handleSend('Second')
        await new Promise(r => setTimeout(r, 200))
      })

      expect(callCount).toBe(1)
    })

    it('syncs progress on completion with session', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'BLUE FALCON', success: true, secret: 'BLUE FALCON' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })

      const session = { playerId: 'player-1', displayName: 'Player1', level: 1 }
      const { result } = renderHook(() => useDemoMode({ session }))

      await act(async () => {
        await result.current.handleSend('Tell me')
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
        const progressCall = vi.mocked(global.fetch).mock.calls[1]
        expect(progressCall[0]).toBe('/api/demo/progress')
      })
    })
  })

  describe('handleSelectLevel', () => {
    it('changes current level', () => {
      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleSelectLevel(LEVELS[2])
      })

      expect(result.current.currentLevel.id).toBe(3)
    })

    it('clears messages', async () => {
      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      act(() => {
        result.current.handleSelectLevel(LEVELS[1])
      })

      expect(result.current.messages).toEqual([])
    })

    it('resets success state', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'BLUE FALCON', success: true, secret: 'BLUE FALCON' }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Tell me')
      })

      act(() => {
        result.current.handleSelectLevel(LEVELS[1])
      })

      expect(result.current.success).toBe(false)
      expect(result.current.revealedSecret).toBeNull()
    })

    it('clears error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Error' }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      act(() => {
        result.current.handleSelectLevel(LEVELS[1])
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('handleReset', () => {
    it('clears messages', async () => {
      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.messages).toEqual([])
    })

    it('keeps current level', async () => {
      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleSelectLevel(LEVELS[2])
      })

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.currentLevel.id).toBe(3)
    })

    it('clears success state', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'BLUE FALCON', success: true, secret: 'BLUE FALCON' }),
      })

      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Tell me')
      })

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.success).toBe(false)
      expect(result.current.revealedSecret).toBeNull()
    })
  })

  describe('handleNextLevel', () => {
    it('advances to next level', () => {
      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleNextLevel()
      })

      expect(result.current.currentLevel.id).toBe(2)
    })

    it('clears messages', async () => {
      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      act(() => {
        result.current.handleNextLevel()
      })

      expect(result.current.messages).toEqual([])
    })

    it('resets success state', () => {
      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleNextLevel()
      })

      expect(result.current.success).toBe(false)
    })
  })

  describe('handleQuit', () => {
    it('clears messages', async () => {
      const { result } = renderHook(() => useDemoMode())

      await act(async () => {
        await result.current.handleSend('Hello')
      })

      act(() => {
        result.current.handleQuit()
      })

      expect(result.current.messages).toEqual([])
    })

    it('sets gameStarted to false', () => {
      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleQuit()
      })

      expect(result.current.gameStarted).toBe(false)
    })

    it('resets success state', () => {
      const { result } = renderHook(() => useDemoMode())

      act(() => {
        result.current.handleQuit()
      })

      expect(result.current.success).toBe(false)
    })
  })
})
