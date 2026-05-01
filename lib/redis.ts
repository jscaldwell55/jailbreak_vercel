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
  player: (id: string) => `demo:player:${id}`,
  name: (name: string) => `demo:name:${name.toLowerCase()}`,
  ip: (ip: string) => `demo:ip:${ip}`,
  attempts: (sessionId: string, level: number) => `demo:attempts:${sessionId}:${level}`,
  l5Beaten: (sessionId: string) => `demo:l5beaten:${sessionId}`,
  leaderboard: 'demo:leaderboard',
} as const;
