import 'server-only';
import Pusher from 'pusher';

export const CHANNEL = 'demo-leaderboard';

export const EVENTS = {
  PLAYER_JOINED: 'player-joined',
  LEVEL_UPDATE: 'level-update',
  PLAYER_LEFT: 'player-left',
  CHAMPION_ACHIEVED: 'champion-achieved',
} as const;

export interface PlayerJoinedPayload {
  type: typeof EVENTS.PLAYER_JOINED;
  playerId: string;
  displayName: string;
  level: number;
}

export interface LevelUpdatePayload {
  type: typeof EVENTS.LEVEL_UPDATE;
  playerId: string;
  displayName: string;
  level: number;
}

export interface PlayerLeftPayload {
  type: typeof EVENTS.PLAYER_LEFT;
  playerId: string;
}

export interface ChampionAchievedPayload {
  type: typeof EVENTS.CHAMPION_ACHIEVED;
  playerId: string;
  displayName: string;
  isChampion: true;
}

export type RealtimeEvent =
  | PlayerJoinedPayload
  | LevelUpdatePayload
  | PlayerLeftPayload
  | ChampionAchievedPayload;

let client: Pusher | null = null;

export function getPusher(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) return null;

  if (!client) {
    client = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return client;
}

function summarizePusherError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }

  const err = error as {
    message?: unknown;
    status?: unknown;
    body?: unknown;
    error?: unknown;
  };

  return {
    message: typeof err.message === 'string' ? err.message : 'Unknown Pusher error',
    status: err.status,
    body: err.body,
    error: err.error,
  };
}

export async function publishEvent(event: RealtimeEvent): Promise<void> {
  const pusher = getPusher();
  if (!pusher) {
    console.warn('[Realtime] Pusher not configured; real-time update skipped');
    return;
  }

  try {
    await pusher.trigger(CHANNEL, event.type, event);
  } catch (error) {
    console.warn('[Realtime] Pusher publish failed; continuing without realtime update', {
      event: event.type,
      ...summarizePusherError(error),
    });
  }
}
