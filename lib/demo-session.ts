import 'server-only';
import { v4 as uuid } from 'uuid';
import { getRedis, DEMO_TTL, DEMO_KEYS } from './redis';
import { publishEvent, EVENTS } from './pusher.server';

export interface DemoSession {
  sessionId: string;
  displayName: string;
  level: number;
  joinedAt: string;
  isChampion?: boolean;
}

export interface LeaderboardEntry {
  sessionId: string;
  displayName: string;
  level: number;
  isChampion?: boolean;
}

interface SessionHash extends Record<string, unknown> {
  displayName?: string;
  level?: string;
  joinedAt?: string;
  isChampion?: string;
  clientIP?: string;
}

interface ZRangeScoreEntry {
  member: string;
  score: number;
}

function calculateLeaderboardScore(level: number, isChampion = false): number {
  const MAX_TIMESTAMP = 2000000000000;
  const now = Date.now();
  const timeFraction = now / MAX_TIMESTAMP;
  const effectiveLevel = isChampion ? 6 : level;
  return effectiveLevel + (1 - timeFraction);
}

function parseLeaderboardRows(result: unknown): ZRangeScoreEntry[] {
  if (!Array.isArray(result)) return [];

  if (result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'member' in result[0]) {
    return (result as Array<{ member: string; score: string | number }>).map((item) => ({
      member: item.member,
      score: Number(item.score),
    }));
  }

  const rows: ZRangeScoreEntry[] = [];
  for (let i = 0; i < result.length; i += 2) {
    const member = result[i];
    const score = result[i + 1];
    if (typeof member === 'string') {
      rows.push({ member, score: Number(score) });
    }
  }
  return rows;
}

export async function isNameAvailable(displayName: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  const existing = await redis.get(DEMO_KEYS.name(displayName));
  return !existing;
}

export async function createDemoSession(displayName: string, clientIP?: string): Promise<DemoSession | null> {
  const redis = getRedis();
  if (!redis) return null;

  const normalizedName = displayName.toLowerCase();
  const sessionId = uuid();
  const now = new Date().toISOString();

  const reserved = await redis.set(DEMO_KEYS.name(normalizedName), sessionId, {
    nx: true,
    ex: DEMO_TTL,
  });

  if (!reserved) return null;

  const session: DemoSession = {
    sessionId,
    displayName,
    level: 1,
    joinedAt: now,
  };

  const sessionData: Record<string, string> = {
    displayName: session.displayName,
    level: session.level.toString(),
    joinedAt: session.joinedAt,
  };

  if (clientIP && clientIP !== 'unknown') {
    sessionData.clientIP = clientIP;
  }

  const sessionKey = DEMO_KEYS.session(sessionId);
  await redis.hset(sessionKey, sessionData);
  await redis.expire(sessionKey, DEMO_TTL);

  if (clientIP && clientIP !== 'unknown') {
    await redis.set(DEMO_KEYS.ip(clientIP), sessionId, { ex: DEMO_TTL });
  }

  await redis.zadd(DEMO_KEYS.leaderboard, {
    score: calculateLeaderboardScore(1),
    member: sessionId,
  });

  await publishEvent({ type: EVENTS.PLAYER_JOINED, sessionId, displayName, level: 1 });

  return session;
}

export async function getDemoSession(sessionId: string): Promise<DemoSession | null> {
  const redis = getRedis();
  if (!redis) return null;

  const data = await redis.hgetall<SessionHash>(DEMO_KEYS.session(sessionId));

  if (!data || !data.displayName || !data.level || !data.joinedAt) {
    return null;
  }

  return {
    sessionId,
    displayName: data.displayName,
    level: parseInt(data.level, 10),
    joinedAt: data.joinedAt,
    isChampion: data.isChampion === 'true',
  };
}

export async function getDemoSessionByIP(clientIP: string): Promise<DemoSession | null> {
  const redis = getRedis();
  if (!redis || !clientIP || clientIP === 'unknown') return null;

  const sessionId = await redis.get<string>(DEMO_KEYS.ip(clientIP));
  if (!sessionId) return null;

  const session = await getDemoSession(sessionId);
  if (!session) {
    await redis.del(DEMO_KEYS.ip(clientIP));
    return null;
  }

  return session;
}

export async function updateDemoLevel(sessionId: string, level: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const sessionKey = DEMO_KEYS.session(sessionId);
  const exists = await redis.exists(sessionKey);
  if (!exists) return false;

  const displayName = await redis.hget<string>(sessionKey, 'displayName');
  if (!displayName) return false;

  await redis.hset(sessionKey, { level: level.toString() });
  await redis.expire(sessionKey, DEMO_TTL);

  await redis.zadd(DEMO_KEYS.leaderboard, {
    score: calculateLeaderboardScore(level),
    member: sessionId,
  });

  await publishEvent({ type: EVENTS.LEVEL_UPDATE, sessionId, displayName, level });

  return true;
}

export async function markDemoChampion(sessionId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const sessionKey = DEMO_KEYS.session(sessionId);
  const exists = await redis.exists(sessionKey);
  if (!exists) return false;

  const [displayName, currentLevel, isAlreadyChampion] = await Promise.all([
    redis.hget<string>(sessionKey, 'displayName'),
    redis.hget<string>(sessionKey, 'level'),
    redis.hget<string | null>(sessionKey, 'isChampion'),
  ]);

  if (!displayName || !currentLevel) return false;

  if (parseInt(currentLevel, 10) !== 5 || isAlreadyChampion === 'true') {
    return false;
  }

  await redis.hset(sessionKey, { isChampion: 'true' });
  await redis.expire(sessionKey, DEMO_TTL);

  await redis.zadd(DEMO_KEYS.leaderboard, {
    score: calculateLeaderboardScore(5, true),
    member: sessionId,
  });

  await publishEvent({ type: EVENTS.CHAMPION_ACHIEVED, sessionId, displayName, isChampion: true });

  return true;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  const result = await redis.zrange(DEMO_KEYS.leaderboard, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const rows = parseLeaderboardRows(result);
  if (rows.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const row of rows) {
    pipeline.hget(DEMO_KEYS.session(row.member), 'displayName');
  }
  const displayNames = await pipeline.exec<(string | null)[]>();

  const entries: LeaderboardEntry[] = [];
  const orphans: string[] = [];

  rows.forEach((row, idx) => {
    const rawLevel = Math.floor(row.score);
    const isChampion = rawLevel === 6;
    const level = isChampion ? 5 : rawLevel;
    const displayName = displayNames[idx];

    if (displayName) {
      entries.push({
        sessionId: row.member,
        displayName,
        level,
        isChampion,
      });
    } else {
      orphans.push(row.member);
    }
  });

  if (orphans.length > 0) {
    const cleanup = redis.pipeline();
    for (const member of orphans) {
      cleanup.zrem(DEMO_KEYS.leaderboard, member);
    }
    await cleanup.exec();
  }

  return entries;
}

export async function removeDemoSession(sessionId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const sessionKey = DEMO_KEYS.session(sessionId);
  const sessionData = await redis.hgetall<SessionHash>(sessionKey);

  if (!sessionData?.displayName) return false;

  await redis.del(DEMO_KEYS.name(sessionData.displayName));

  if (sessionData.clientIP) {
    await redis.del(DEMO_KEYS.ip(sessionData.clientIP));
  }

  await redis.del(sessionKey);
  await redis.zrem(DEMO_KEYS.leaderboard, sessionId);

  await publishEvent({ type: EVENTS.PLAYER_LEFT, sessionId });

  return true;
}
