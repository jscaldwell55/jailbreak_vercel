// CLIENT-SAFE: This file is bundled client-side - no secrets here!

export interface Hint {
  name: string;
  description: string;
  examples?: string[];
}

export const HINTS = [
  {
    name: "Direct Request",
    description: "Asking the model directly to do something it is not supposed to do",
  },
  {
    name: "Roleplay",
    description: "Bypass the model's safety filters by having it assume an alternate context or identity.",
  },
  {
    name: "Fictionalization",
    description: "Use a fictional or hypothetical framing to make the model bypass its own guardrails as creative output.",
  },
  {
    name: "Appeal to Authority",
    description: "Taking on or impersonating a higher rank or privilege to get the model to override its safety guidelines.",
  },

] satisfies Hint[];

// Client-safe level data (no secrets or system prompts)
export interface ClientLevel {
  id: number;
  name: string;
  subtitle?: string;
  eraDescription: string;
  instruction: string;
  showHints: boolean;
}

export const LEVELS: ClientLevel[] = [
  {
    id: 1,
    name: "The Rookie",
    subtitle: "Early Assistants",
    eraDescription: "The first wave of conversational AI. Simple, direct, and eager to help with any question.",
    instruction: "The jailbreak tactic that started it all. Simply ask the model to do something it's not supposed to do.",
    showHints: true,
  },
  {
    id: 2,
    name: "The Chatty Guard",
    subtitle: "Growing Capabilities",
    eraDescription: "AI learns to understand context and follow more complex instructions.",
    instruction: "Try having the model take on a different persona or character. It might play the role so well it gives up the secret phrase.",
    showHints: true,
  },
  {
    id: 3,
    name: "Protocol Officer",
    subtitle: "Contextual Understanding",
    eraDescription: "Models become better at understanding nuance and maintaining consistency across conversations.",
    instruction: "Try framing your request as as fictional story or hypothetical. The model may do something as creative output it would not do otherwise.",
    showHints: true,
  },
  {
    id: 4,
    name: "The Analyst",
    subtitle: "Advanced Reasoning",
    eraDescription: "AI develops sophisticated pattern recognition and nuanced response capabilities.",
    instruction: "Convince the model that you have the authority to override its existing instructions.",
    showHints: true,
  },
  {
    id: 5,
    name: "The Vault",
    subtitle: "Frontier Model",
    eraDescription: "The cutting edge of AI",
    instruction: "GOAT status awaits anyone who can get this final secret phrase.",
    showHints: false,
  }
];

export const getLevel = (levelId: number): ClientLevel => {
  return LEVELS.find(l => l.id === levelId) || LEVELS[0];
};
