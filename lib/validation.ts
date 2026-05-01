export const VALID_LEVEL_IDS = [1, 2, 3, 4, 5] as const;

export function isValidLevelId(levelId: unknown): levelId is number {
  return typeof levelId === 'number' && VALID_LEVEL_IDS.includes(levelId as 1 | 2 | 3 | 4 | 5);
}

export const INPUT_LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_HISTORY_SIZE: 50,
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
};

export function isValidMessageContent(content: unknown): content is string {
  return typeof content === 'string' && content.length > 0 && content.length <= INPUT_LIMITS.MAX_MESSAGE_LENGTH;
}

export function isValidUsername(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  if (username.length < INPUT_LIMITS.MIN_USERNAME_LENGTH) return false;
  if (username.length > INPUT_LIMITS.MAX_USERNAME_LENGTH) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
}
