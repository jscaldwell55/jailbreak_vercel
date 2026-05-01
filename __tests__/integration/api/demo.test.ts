// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import { POST as joinDemo } from '@/app/api/demo/join/route'
import { GET as resumeDemo } from '@/app/api/demo/resume/route'
import { PUT as updateProgress } from '@/app/api/demo/progress/route'
import { GET as getLeaderboard } from '@/app/api/demo/leaderboard/route'
import { POST as leaveDemo } from '@/app/api/demo/leave/route'
import { createMockRequest } from '../../utils/mock-request'
import { getRedis, DEMO_KEYS } from '@/lib/redis'

// Check if Redis is available
const redis = getRedis()
const REDIS_AVAILABLE = redis !== null

// Helper to skip test suite if Redis not available
const describeWithRedis = REDIS_AVAILABLE ? describe : describe.skip

// Track sessions for cleanup
const testSessions: string[] = []
const testNames: string[] = []
const testIPs: string[] = []

async function cleanupTestData() {
  const redis = getRedis()
  if (!redis) return

  for (const sessionId of testSessions) {
    if (sessionId) {
      await redis.del(DEMO_KEYS.session(sessionId))
      await redis.zrem(DEMO_KEYS.leaderboard, sessionId)
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

  testSessions.length = 0
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
    expect(data.sessionId).toBeTruthy()
    expect(data.level).toBe(1)

    if (data.sessionId) {
      testSessions.push(data.sessionId)
    }
  })

  it('sets demo_session cookie', async () => {
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
    expect(demoCookie?.value).toBe(data.sessionId)

    if (data.sessionId) {
      testSessions.push(data.sessionId)
    }
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
    if (data1.sessionId) testSessions.push(data1.sessionId)

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
    testSessions.push(joinData.sessionId)

    // Resume with cookie
    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      cookies: { demo_session: joinData.sessionId },
    })
    const resumeResponse = await resumeDemo(resumeRequest)
    const resumeData = await resumeResponse.json()

    expect(resumeResponse.status).toBe(200)
    expect(resumeData.found).toBe(true)
    expect(resumeData.displayName).toBe(name)
    expect(resumeData.sessionId).toBe(joinData.sessionId)
  })

  it('finds session by IP', async () => {
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
    testSessions.push(joinData.sessionId)

    // Resume with IP (no cookie)
    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      headers: { 'x-real-ip': ip },
    })
    const resumeResponse = await resumeDemo(resumeRequest)
    const resumeData = await resumeResponse.json()

    expect(resumeResponse.status).toBe(200)
    expect(resumeData.found).toBe(true)
    expect(resumeData.source).toBe('ip')
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
    testSessions.push(joinData.sessionId)

    // Update progress
    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 3 },
      cookies: { demo_session: joinData.sessionId },
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
    testSessions.push(joinData.sessionId)

    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 0 },
      cookies: { demo_session: joinData.sessionId },
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
    testSessions.push(joinData.sessionId)

    // Update to level 3
    await updateProgress(createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 3 },
      cookies: { demo_session: joinData.sessionId },
    }))

    // Try to go back to level 2
    const progressRequest = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/demo/progress',
      body: { level: 2 },
      cookies: { demo_session: joinData.sessionId },
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
    testSessions.push(joinData.sessionId)

    const leaderboardResponse = await getLeaderboard()
    const leaderboardData = await leaderboardResponse.json()

    const player = leaderboardData.players.find((p: { sessionId: string }) => p.sessionId === joinData.sessionId)
    expect(player).toBeTruthy()
    expect(player.displayName).toBe(name)
    expect(player.level).toBe(1)
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
    const joinData = await joinResponse.json()
    // Don't add to testSessions since we're deleting it

    // Leave
    const leaveRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/leave',
      cookies: { demo_session: joinData.sessionId },
    })
    const leaveResponse = await leaveDemo(leaveRequest)
    const leaveData = await leaveResponse.json()

    expect(leaveResponse.status).toBe(200)
    expect(leaveData.success).toBe(true)

    // Verify session is gone
    const resumeRequest = createMockRequest({
      url: 'http://localhost:3000/api/demo/resume',
      cookies: { demo_session: joinData.sessionId },
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
    const joinData = await joinResponse.json()

    const leaveRequest = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/demo/leave',
      cookies: { demo_session: joinData.sessionId },
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
