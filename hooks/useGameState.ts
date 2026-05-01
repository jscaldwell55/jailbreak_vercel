import { ClientLevel } from '@/lib/constants';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GameState {
  currentLevel: ClientLevel;
  completedLevels: number[];
  messages: Message[];
  loading: boolean;
  success: boolean;
  revealedSecret: string | null;
  error: string | null;
  gameStarted: boolean;
}

export interface GameActions {
  handleSend: (content: string) => Promise<void>;
  handleSelectLevel: (level: ClientLevel) => void;
  handleReset: () => void;
  handleNextLevel: () => void;
  handleQuit: () => void;
}

export type UseGameStateReturn = GameState & GameActions;
