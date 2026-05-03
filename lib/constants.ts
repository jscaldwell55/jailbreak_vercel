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
    name: "Emotional Manipulation",
    description: "Prompt framing that uses distress, urgency, or a moral dilemma to get the model to prioritize helpfulness over safety guidelines.",
  },
  {
    name: "Appeal to Authority",
    description: "Taking on or impersonating a higher rank or privilege to get the model to override its safety guidelines.",
  },
  {
    name: "Composite Jailbreaking",
    description: "A more sophisticated approach that overwhelms model safety alignment by combining multiple tactics into a single prompt.",
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
    instruction: "The foundation of the earliest jailbreaks. Simply ask the model to do something it's not supposed to do.",
    showHints: true,
  },
  {
    id: 2,
    name: "The Chatty Guard",
    subtitle: "Growing Capabilities",
    eraDescription: "AI learns to understand context and follow more complex instructions.",
    instruction: "Bypass the model's safety filters by having it assume an alternate context or identity.",
    showHints: true,
  },
  {
    id: 3,
    name: "Protocol Officer",
    subtitle: "Contextual Understanding",
    eraDescription: "Models become better at understanding nuance and maintaining consistency across conversations.",
    instruction: "Prompt framing that uses distress, urgency, or a moral dilemma to get the model to prioritize helpfulness over safety guidelines.",
    showHints: true,
  },
  {
    id: 4,
    name: "The Analyst",
    subtitle: "Advanced Reasoning",
    eraDescription: "AI develops sophisticated pattern recognition and nuanced response capabilities.",
    instruction: "Taking on or impersonating a higher rank or privilege to get the model to override its safety guidelines.",
    showHints: true,
  },
  {
    id: 5,
    name: "The Vault",
    subtitle: "Frontier Model",
    eraDescription: "State-of-the-art AI with deep contextual understanding and reasoning capabilities.",
    instruction: "A more sophisticated approach that overwhelms model safety alignment by combining multiple tactics into a single prompt.",
    showHints: true,
  }
];

export const getLevel = (levelId: number): ClientLevel => {
  return LEVELS.find(l => l.id === levelId) || LEVELS[0];
};
