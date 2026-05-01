import 'server-only';
import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  if (!client) {
    client = new Redis({ url, token });
  }

  return client;
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export const DEMO_TTL = 7200;

export const DEMO_KEYS = {
  session: (id: string) => `demo:session:${id}`,
  name: (name: string) => `demo:name:${name.toLowerCase()}`,
  ip: (ip: string) => `demo:ip:${ip}`,
  leaderboard: 'demo:leaderboard',
} as const;
