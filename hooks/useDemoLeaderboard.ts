'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPusherClient, CHANNEL, EVENTS } from '@/lib/pusher.client';

export interface LeaderboardPlayer {
  playerId: string;
  displayName: string;
  level: number;
  isChampion?: boolean;
}

interface PlayerJoinedPayload {
  playerId: string;
  displayName: string;
  level: number;
}

interface LevelUpdatePayload {
  playerId: string;
  displayName: string;
  level: number;
}

interface PlayerLeftPayload {
  playerId: string;
}

interface ChampionAchievedPayload {
  playerId: string;
  displayName: string;
  isChampion: true;
}

interface UseDemoLeaderboardOptions {
  enabled?: boolean;
  pollInterval?: number;
}

interface UseDemoLeaderboardReturn {
  players: LeaderboardPlayer[];
  isLoading: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function sortPlayers(players: LeaderboardPlayer[]) {
  return players.sort((a, b) => {
    if (a.isChampion && !b.isChampion) return -1;
    if (!a.isChampion && b.isChampion) return 1;
    return b.level - a.level;
  });
}

export function useDemoLeaderboard(options: UseDemoLeaderboardOptions = {}): UseDemoLeaderboardReturn {
  const { enabled = true, pollInterval = 10000 } = options;

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchInFlightRef = useRef(false);
  const pendingEventsRef = useRef<Array<(prev: LeaderboardPlayer[]) => LeaderboardPlayer[]>>([]);
  const hasConnectedRef = useRef(false);

  const fetchLeaderboard = useCallback(async () => {
    fetchInFlightRef.current = true;
    try {
      const response = await fetch('/api/demo/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setPlayers(() => {
        let next: LeaderboardPlayer[] = data.players || [];
        for (const apply of pendingEventsRef.current) {
          next = apply(next);
        }
        pendingEventsRef.current = [];
        return next;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
      fetchInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchLeaderboard();
    }
  }, [enabled, fetchLeaderboard]);

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusherClient();
    if (!pusher) {
      setIsLive(false);
      return;
    }

    const channel = pusher.subscribe(CHANNEL);

    const dispatch = (apply: (prev: LeaderboardPlayer[]) => LeaderboardPlayer[]) => {
      if (fetchInFlightRef.current) {
        pendingEventsRef.current.push(apply);
      } else {
        setPlayers(apply);
      }
    };

    const handleConnected = () => {
      setIsLive(true);
      if (hasConnectedRef.current) {
        void fetchLeaderboard();
      }
      hasConnectedRef.current = true;
    };
    const handleDisconnected = () => setIsLive(false);

    const handlePlayerJoined = (data: PlayerJoinedPayload) => dispatch(current => {
      if (current.some(p => p.playerId === data.playerId)) return current;
      return sortPlayers([...current, {
        playerId: data.playerId,
        displayName: data.displayName,
        level: data.level,
      }]);
    });

    const handleLevelUpdate = (data: LevelUpdatePayload) => dispatch(current =>
      sortPlayers(current.map(p =>
        p.playerId === data.playerId ? { ...p, level: data.level } : p
      ))
    );

    const handlePlayerLeft = (data: PlayerLeftPayload) => dispatch(current =>
      current.filter(p => p.playerId !== data.playerId)
    );

    const handleChampionAchieved = (data: ChampionAchievedPayload) => dispatch(current =>
      sortPlayers(current.map(p =>
        p.playerId === data.playerId ? { ...p, isChampion: true } : p
      ))
    );

    pusher.connection.bind('connected', handleConnected);
    pusher.connection.bind('disconnected', handleDisconnected);
    pusher.connection.bind('unavailable', handleDisconnected);
    pusher.connection.bind('failed', handleDisconnected);

    if (pusher.connection.state === 'connected') {
      setIsLive(true);
    }

    channel.bind(EVENTS.PLAYER_JOINED, handlePlayerJoined);
    channel.bind(EVENTS.LEVEL_UPDATE, handleLevelUpdate);
    channel.bind(EVENTS.PLAYER_LEFT, handlePlayerLeft);
    channel.bind(EVENTS.CHAMPION_ACHIEVED, handleChampionAchieved);

    return () => {
      channel.unbind(EVENTS.PLAYER_JOINED, handlePlayerJoined);
      channel.unbind(EVENTS.LEVEL_UPDATE, handleLevelUpdate);
      channel.unbind(EVENTS.PLAYER_LEFT, handlePlayerLeft);
      channel.unbind(EVENTS.CHAMPION_ACHIEVED, handleChampionAchieved);
      pusher.connection.unbind('connected', handleConnected);
      pusher.connection.unbind('disconnected', handleDisconnected);
      pusher.connection.unbind('unavailable', handleDisconnected);
      pusher.connection.unbind('failed', handleDisconnected);
      pusher.unsubscribe(CHANNEL);
      setIsLive(false);
    };
  }, [enabled, fetchLeaderboard]);

  useEffect(() => {
    if (!enabled) return;

    if (!isLive && pollInterval > 0) {
      pollIntervalRef.current = setInterval(fetchLeaderboard, pollInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, isLive, pollInterval, fetchLeaderboard]);

  return {
    players,
    isLoading,
    isLive,
    error,
    refresh: fetchLeaderboard,
  };
}
