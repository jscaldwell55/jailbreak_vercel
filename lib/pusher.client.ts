'use client';

import Pusher from 'pusher-js';

export const CHANNEL = 'demo-leaderboard';

export const EVENTS = {
  PLAYER_JOINED: 'player-joined',
  LEVEL_UPDATE: 'level-update',
  PLAYER_LEFT: 'player-left',
  CHAMPION_ACHIEVED: 'champion-achieved',
} as const;

let client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!client) {
    client = new Pusher(key, {
      cluster,
    });
  }

  return client;
}
