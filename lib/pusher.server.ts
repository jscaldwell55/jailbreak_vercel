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
  sessionId: string;
  displayName: string;
  level: number;
}

export interface LevelUpdatePayload {
  type: typeof EVENTS.LEVEL_UPDATE;
  sessionId: string;
  displayName: string;
  level: number;
}

export interface PlayerLeftPayload {
  type: typeof EVENTS.PLAYER_LEFT;
  sessionId: string;
}

export interface ChampionAchievedPayload {
  type: typeof EVENTS.CHAMPION_ACHIEVED;
  sessionId: string;
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

export async function publishEvent(event: RealtimeEvent): Promise<void> {
  const pusher = getPusher();
  if (!pusher) {
    console.warn('[Realtime] Pusher not configured; real-time update skipped');
    return;
  }

  await pusher.trigger(CHANNEL, event.type, event);
}
