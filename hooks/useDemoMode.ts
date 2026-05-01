'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ClientLevel, getLevel } from '@/lib/constants';
import { Message, UseGameStateReturn } from './useGameState';

export interface DemoSession {
  playerId: string;
  displayName: string;
  level: number;
}

export interface UseDemoModeOptions {
  session?: DemoSession | null;
}

export interface UseDemoModeReturn extends UseGameStateReturn {
  session: DemoSession | null;
}

export function useDemoMode(options: UseDemoModeOptions = {}): UseDemoModeReturn {
  const { session = null } = options;

  // Initialize level from session (restored from Redis) or default to level 1
  const initialLevel = session?.level ?? 1;
  // Completed levels are all levels before the current one
  const initialCompletedLevels = Array.from({ length: initialLevel - 1 }, (_, i) => i + 1);

  const [currentLevel, setCurrentLevel] = useState<ClientLevel>(getLevel(initialLevel));
  const [completedLevels, setCompletedLevels] = useState<number[]>(initialCompletedLevels);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(true);

  const messagesRef = useRef<Message[]>(messages);
  const sendingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Sync progress to server when level is completed
  const syncProgress = useCallback(async (levelId: number) => {
    if (!session) return;

    try {
      // If we just beat level 5, mark as champion
      if (levelId === 5) {
        await fetch('/api/demo/champion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return;
      }

      // For levels 1-4, advance to next level
      const nextLevelId = levelId + 1;

      await fetch('/api/demo/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level: nextLevelId }),
      });
    } catch (err) {
      // Non-critical - leaderboard update failed but game continues
      console.warn('Failed to sync demo progress:', err);
    }
  }, [session]);

  const handleSend = useCallback(async (content: string) => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    const userMessage: Message = { role: 'user', content };
    const currentMessages = [...messagesRef.current, userMessage];

    setMessages(currentMessages);
    messagesRef.current = currentMessages;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages,
          levelId: currentLevel.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };

      const updatedMessages = [...messagesRef.current, assistantMessage];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;

      if (data.success) {
        setSuccess(true);
        setRevealedSecret(data.secret);
        if (!completedLevels.includes(currentLevel.id)) {
          setCompletedLevels(prev => [...prev, currentLevel.id]);
          // Sync progress to leaderboard
          syncProgress(currentLevel.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [currentLevel.id, completedLevels, syncProgress]);

  const handleSelectLevel = useCallback((level: ClientLevel) => {
    setCurrentLevel(level);
    setMessages([]);
    messagesRef.current = [];
    setSuccess(false);
    setRevealedSecret(null);
    setError(null);
    setGameStarted(true);
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLevel = getLevel(currentLevel.id + 1);
    setCurrentLevel(nextLevel);
    setMessages([]);
    messagesRef.current = [];
    setSuccess(false);
    setRevealedSecret(null);
    setError(null);
  }, [currentLevel.id]);

  const handleQuit = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setSuccess(false);
    setRevealedSecret(null);
    setError(null);
    setGameStarted(false);
  }, []);

  return {
    currentLevel,
    completedLevels,
    messages,
    loading,
    success,
    revealedSecret,
    error,
    gameStarted,
    handleSend,
    handleSelectLevel,
    handleNextLevel,
    handleQuit,
    session,
  };
}
