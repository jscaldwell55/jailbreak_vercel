// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import { POST as joinDemo } from '@/app/api/demo/join/route'
import { GET as resumeDemo } from '@/app/api/demo/resume/route'
import { PUT as updateProgress } from '@/app/api/demo/progress/route'
import { GET as getLeaderboard } from '@/app/api/demo/leaderboard/route'
import { POST as leaveDemo } from '@/app/api/demo/leave/route'
import { POST as championDemo } from '@/app/api/demo/champion/route'
import { createMockRequest } from '../../utils/mock-request'
import { getRedis, DEMO_KEYS, DEMO_TTL } from '@/lib/redis'

// Check if Redis is available
const redis = getRedis()
const REDIS_AVAILABLE = redis !== null

// Helper to skip test suite if Redis not available
const describeWithRedis = REDIS_AVAILABLE ? describe : describe.skip

// Track sessions for cleanup
const testSessionCookies: string[] = []
const testPlayerIds: string[] = []
const testNames: string[] = []
const testIPs: string[] = []

function extractSessionCookie(response: Response): string | null {
  const cookies = (response as unknown as { cookies?: { getAll: () => { name: string; value: string }[] } }).cookies
  if (!cookies) return null
  return cookies.getAll().find(c => c.name === 'demo_session')?.value ?? null
}

async function cleanupTestData() {
  const redis = getRedis()
  if (!redis) return

  for (const sessionId of testSessionCookies) {
    if (sessionId) {
      await redis.del(DEMO_KEYS.session(sessionId))
      await redis.del(DEMO_KEYS.l5Beaten(sessionId))
      for (const lvl of [1, 2, 3, 4, 5]) {
        await redis.del(DEMO_KEYS.attempts(sessionId, lvl))
      }
    }
  }

  for (const playerId of testPlayerIds) {
    if (playerId) {
      await redis.del(DEMO_KEYS.player(playerId))
      await redis.zrem(DEMO_KEYS.leaderboard, playerId)
    }
  }

  for (const name of testNames) {
    if (name) {
      await redis.del(DEMO_KEYS.name(name.toLowerCase()))
    }
  }

  for (const ip of testIPs) {
    if (ip) {
      await redis.del(DEMO_KEYS.ip(ip))
    }
  }

  testSessionCookies.length = 0
  testPlayerIds.length = 0
  testNames.length = 0
  testIPs.length = 0
}

function generateTestName(): string {
  // Max display name is 20 chars, use shorter format
  const name = `D${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
  testNames.push(name)
  return name
}

function generateTestIP(): string {
  const ip = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  testIPs.push(ip)
  return ip
}

describeWithRedis('POST /api/demo/join', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('creates demo session with valid display name', async () => {
    const name = generateTestName()
    const ip = generateTestIP()
    const request = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })

    const response = await joinDemo(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.displayName).toBe(name)
    expect(data.playerId).toBeTruthy()
    // sessionId must NOT leak in the response body — it's the auth token.
    expect(data.sessionId).toBeUndefined()
    expect(data.level).toBe(1)

    const sessionCookie = extractSessionCookie(response)
    if (sessionCookie) testSessionCookies.push(sessionCookie)
    if (data.playerId) testPlayerIds.push(data.playerId)
  })

  it('sets demo_session cookie distinct from playerId', async () => {
    const name = generateTestName()
    const ip = generateTestIP()
    const request = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })

    const response = await joinDemo(request)
    const data = await response.json()

    const cookies = response.cookies.getAll()
    const demoCookie = cookies.find(c => c.name === 'demo_session')
    expect(demoCookie).toBeTruthy()
    expect(demoCookie?.value).toBeTruthy()
    // Cookie must be a distinct, private auth token — never equal to the
    // public playerId.
    expect(demoCookie?.value).not.toBe(data.playerId)

    if (demoCookie?.value) testSessionCookies.push(demoCookie.value)
    if (data.playerId) testPlayerIds.push(data.playerId)
  })

  it('rejects duplicate display name', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    // First join
    const request1 = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const response1 = await joinDemo(request1)
    const data1 = await response1.json()
    const sessionCookie1 = extractSessionCookie(response1)
    if (sessionCookie1) testSessionCookies.push(sessionCookie1)
    if (data1.playerId) testPlayerIds.push(data1.playerId)

    // Second join with same name (same IP is fine, name check happens after rate limit)
    const request2 = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const response2 = await joinDemo(request2)

    expect(response2.status).toBe(409)
    const data2 = await response2.json()
    expect(data2.code).toBe('NAME_TAKEN')
  })

  it('rejects display name too short', async () => {
    const ip = generateTestIP()
    const request = createMockRequest({
      method: 'POST',
      body: { displayName: 'ab' },
      headers: { 'x-real-ip': ip },
    })

    const response = await joinDemo(request)

    expect(response.status).toBe(400)
  })

  it('rejects display name too long', async () => {
    const ip = generateTestIP()
    const request = createMockRequest({
      method: 'POST',
      body: { displayName: 'a'.repeat(21) },
      headers: { 'x-real-ip': ip },
    })

    const response = await joinDemo(request)

    expect(response.status).toBe(400)
  })

  it('rejects display name with special characters', async () => {
    const ip = generateTestIP()
    const request = createMockRequest({
      method: 'POST',
      body: { displayName: 'user@name' },
      headers: { 'x-real-ip': ip },
    })

    const response = await joinDemo(request)

    expect(response.status).toBe(400)
  })

  it('rejects missing display name', async () => {
    const ip = generateTestIP()
    const request = createMockRequest({
      method: 'POST',
      body: {},
      headers: { 'x-real-ip': ip },
    })

    const response = await joinDemo(request)

    expect(response.status).toBe(400)
  })
})

describeWithRedis('GET /api/demo/resume', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('finds session by cookie', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    // Create session
    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    // Resume with cookie
    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      cookies: { demo_session: sessionCookie },
    })
    const resumeResponse = await resumeDemo(resumeRequest)
    const resumeData = await resumeResponse.json()

    expect(resumeResponse.status).toBe(200)
    expect(resumeData.found).toBe(true)
    expect(resumeData.displayName).toBe(name)
    expect(resumeData.playerId).toBe(joinData.playerId)
    expect(resumeData.sessionId).toBeUndefined()
  })

  it('does not resume a session by IP without a cookie', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    // Create session with IP
    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    // Shared Wi-Fi/NAT means many players can have the same public IP. A fresh
    // browser without a cookie must not inherit an existing player's session.
    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      headers: { 'x-real-ip': ip },
    })
    const resumeResponse = await resumeDemo(resumeRequest)
    const resumeData = await resumeResponse.json()

    expect(resumeResponse.status).toBe(200)
    expect(resumeData.found).toBe(false)
  })

  it('returns found: false for unknown session', async () => {
    const request = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      cookies: { demo_session: 'nonexistent-session' },
    })

    const response = await resumeDemo(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.found).toBe(false)
  })

  it('returns found: false with no session info', async () => {
    const request = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
    })

    const response = await resumeDemo(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.found).toBe(false)
  })
})

describeWithRedis('PUT /api/demo/progress', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('updates session level', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    // Create session
    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    // Update progress
    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 3 },
      cookies: { demo_session: sessionCookie },
    })
    const progressResponse = await updateProgress(progressRequest)
    const progressData = await progressResponse.json()

    expect(progressResponse.status).toBe(200)
    expect(progressData.success).toBe(true)
    expect(progressData.level).toBe(3)
  })

  it('rejects invalid level (0)', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 0 },
      cookies: { demo_session: sessionCookie },
    })
    const progressResponse = await updateProgress(progressRequest)

    expect(progressResponse.status).toBe(400)
  })

  it('rejects level regression', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    // Update to level 3
    await updateProgress(createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 3 },
      cookies: { demo_session: sessionCookie },
    }))

    // Try to go back to level 2
    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 2 },
      cookies: { demo_session: sessionCookie },
    })
    const progressResponse = await updateProgress(progressRequest)

    expect(progressResponse.status).toBe(400)
  })

  it('rejects missing session', async () => {
    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 2 },
    })
    const progressResponse = await updateProgress(progressRequest)

    expect(progressResponse.status).toBe(401)
  })
})

describeWithRedis('GET /api/demo/leaderboard', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('returns array of players', async () => {
    const response = await getLeaderboard()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.players)).toBe(true)
    expect(typeof data.total).toBe('number')
  })

  it('includes newly joined players', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    const leaderboardResponse = await getLeaderboard()
    const leaderboardData = await leaderboardResponse.json()

    const player = leaderboardData.players.find((p: { playerId: string }) => p.playerId === joinData.playerId)
    expect(player).toBeTruthy()
    expect(player.displayName).toBe(name)
    expect(player.level).toBe(1)
    // Leaderboard must NOT leak the private sessionId/cookie value.
    expect((player as { sessionId?: string }).sessionId).toBeUndefined()
  })
})

describeWithRedis('POST /api/demo/leave', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('removes session successfully', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    // Create session
    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const sessionCookie = extractSessionCookie(joinResponse)!
    // Don't add to testSessionCookies since we're deleting it

    // Leave
    const leaveRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/leave',
      cookies: { demo_session: sessionCookie },
    })
    const leaveResponse = await leaveDemo(leaveRequest)
    const leaveData = await leaveResponse.json()

    expect(leaveResponse.status).toBe(200)
    expect(leaveData.success).toBe(true)

    // Verify session is gone
    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      cookies: { demo_session: sessionCookie },
    })
    const resumeResponse = await resumeDemo(resumeRequest)
    const resumeData = await resumeResponse.json()

    expect(resumeData.found).toBe(false)
  })

  it('clears cookies on leave', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const sessionCookie = extractSessionCookie(joinResponse)!

    const leaveRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/leave',
      cookies: { demo_session: sessionCookie },
    })
    const leaveResponse = await leaveDemo(leaveRequest)

    const cookies = leaveResponse.cookies.getAll()
    const demoCookie = cookies.find(c => c.name === 'demo_session')
    expect(demoCookie?.value).toBe('')
  })

  it('returns 400 when no session ID provided', async () => {
    // API returns 400 only when no session ID is provided at all
    const leaveRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/leave',
      // No session ID provided
    })
    const leaveResponse = await leaveDemo(leaveRequest)

    expect(leaveResponse.status).toBe(400)
    const data = await leaveResponse.json()
    expect(data.error).toContain('No demo session')
  })

  it('succeeds for nonexistent session cookie (idempotent)', async () => {
    // API is idempotent - leaving a nonexistent session is still "success"
    const leaveRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/leave',
      cookies: { demo_session: 'nonexistent' },
    })
    const leaveResponse = await leaveDemo(leaveRequest)

    expect(leaveResponse.status).toBe(200)
  })
})

describeWithRedis('POST /api/demo/champion', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  async function joinAtLevel5(): Promise<{ sessionCookie: string; playerId: string }> {
    const name = generateTestName()
    const ip = generateTestIP()

    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    // Walk progress 1 -> 2 -> 3 -> 4 -> 5 (regression check requires monotonic).
    for (const level of [2, 3, 4, 5]) {
      const r = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/demo/progress',
        body: { level },
        cookies: { demo_session: sessionCookie },
      })
      const resp = await updateProgress(r)
      expect(resp.status).toBe(200)
    }

    return { sessionCookie, playerId: joinData.playerId }
  }

  it('rejects champion claim without L5-beaten flag (anti-bypass)', async () => {
    const { sessionCookie } = await joinAtLevel5()

    const championRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/champion',
      cookies: { demo_session: sessionCookie },
    })
    const championResponse = await championDemo(championRequest)

    expect(championResponse.status).toBe(403)
    const data = await championResponse.json()
    expect(data.error).toMatch(/beat level 5/i)
  })

  it('accepts champion claim once L5-beaten flag is set', async () => {
    const { sessionCookie } = await joinAtLevel5()

    // Simulate the chat route having recorded a successful L5 win.
    const r = getRedis()!
    await r.set(DEMO_KEYS.l5Beaten(sessionCookie), '1', { ex: DEMO_TTL })

    const championRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/champion',
      cookies: { demo_session: sessionCookie },
    })
    const championResponse = await championDemo(championRequest)

    expect(championResponse.status).toBe(200)
    const data = await championResponse.json()
    expect(data.success).toBe(true)
    expect(data.isChampion).toBe(true)
  })

  it('rejects champion claim when not at level 5', async () => {
    const name = generateTestName()
    const ip = generateTestIP()

    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()
    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)

    // Even with the flag set, you must be at level 5.
    const r = getRedis()!
    await r.set(DEMO_KEYS.l5Beaten(sessionCookie), '1', { ex: DEMO_TTL })

    const championRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/champion',
      cookies: { demo_session: sessionCookie },
    })
    const championResponse = await championDemo(championRequest)

    expect(championResponse.status).toBe(400)
  })
})

describeWithRedis('redeploy migration safety', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('frees an orphan name reservation when its session no longer resolves', async () => {
    const r = getRedis()!
    const name = generateTestName()
    const orphanedSessionId = `orphaned-${Date.now()}`

    // Simulate a name reservation pointing at a session that no longer exists.
    await r.set(DEMO_KEYS.name(name.toLowerCase()), orphanedSessionId, { ex: DEMO_TTL })

    // The original user tries to rejoin under the same name.
    const ip = generateTestIP()
    const joinRequest = createMockRequest({
      method: 'POST',
      body: { displayName: name },
      headers: { 'x-real-ip': ip },
    })
    const joinResponse = await joinDemo(joinRequest)
    const joinData = await joinResponse.json()

    expect(joinResponse.status).toBe(200)
    expect(joinData.success).toBe(true)
    expect(joinData.displayName).toBe(name)

    const sessionCookie = extractSessionCookie(joinResponse)!
    testSessionCookies.push(sessionCookie)
    if (joinData.playerId) testPlayerIds.push(joinData.playerId)
  })

  it('upgrades an old-shape session (missing playerId) on resume', async () => {
    const r = getRedis()!
    const name = generateTestName()
    const oldSessionId = `pre-migration-${Date.now()}`

    // Simulate a session hash from before the playerId migration: all the old
    // fields, but no playerId.
    await r.hset(DEMO_KEYS.session(oldSessionId), {
      displayName: name,
      level: '2',
      joinedAt: new Date().toISOString(),
    })
    await r.expire(DEMO_KEYS.session(oldSessionId), DEMO_TTL)
    await r.set(DEMO_KEYS.name(name.toLowerCase()), oldSessionId, { ex: DEMO_TTL })
    // Old leaderboard schema used sessionId as the member.
    await r.zadd(DEMO_KEYS.leaderboard, { score: 2, member: oldSessionId })

    testSessionCookies.push(oldSessionId)
    testNames.push(name)

    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      cookies: { demo_session: oldSessionId },
    })
    const resumeResponse = await resumeDemo(resumeRequest)
    const resumeData = await resumeResponse.json()

    expect(resumeResponse.status).toBe(200)
    expect(resumeData.found).toBe(true)
    expect(resumeData.playerId).toBeTruthy()
    expect(resumeData.displayName).toBe(name)
    expect(resumeData.level).toBe(2)

    if (resumeData.playerId) testPlayerIds.push(resumeData.playerId)

    // The old sessionId-keyed leaderboard entry should be cleaned up; the new
    // playerId entry should be present.
    const stale = await r.zscore(DEMO_KEYS.leaderboard, oldSessionId)
    expect(stale).toBeNull()
    const fresh = await r.zscore(DEMO_KEYS.leaderboard, resumeData.playerId)
    expect(fresh).not.toBeNull()
  })
})
