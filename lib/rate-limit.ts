import 'server-only';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

export type RateLimitType = 'chat' | 'chat:demo' | 'demo-join';

interface RateLimitConfig {
  points: number;
  duration: number;
  keyPrefix: string;
}

const RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  chat: { points: 200, duration: 60, keyPrefix: 'ratelimit:chat' },
  'chat:demo': { points: 60, duration: 60, keyPrefix: 'ratelimit:chat:demo' },
  'demo-join': { points: 5, duration: 60, keyPrefix: 'ratelimit:demo-join' },
};

const limiterCache = new Map<RateLimitType, Ratelimit>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

function isRateLimitDisabled(): boolean {
  const value = process.env.RATE_LIMIT_DISABLED;
  return value === 'true' || value === '1';
}

function getLimiter(type: RateLimitType): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const existing = limiterCache.get(type);
  if (existing) return existing;

  const cfg = RATE_LIMITS[type];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.points, `${cfg.duration} s`),
    prefix: cfg.keyPrefix,
    analytics: false,
  });

  limiterCache.set(type, limiter);
  return limiter;
}

export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER };
  }

  const cfg = RATE_LIMITS[type];
  const limiter = getLimiter(type);

  if (!limiter) {
    return { allowed: true, remaining: cfg.points };
  }

  try {
    const res = await limiter.limit(identifier);
    return { allowed: res.success, remaining: res.remaining };
  } catch (err) {
    console.error(`[RateLimit] ${type} error:`, err);
    return { allowed: true, remaining: cfg.points };
  }
}

export function getClientIP(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}
