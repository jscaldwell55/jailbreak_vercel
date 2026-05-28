export const ACCESS_COOKIE_NAME = 'jailbreak_access';
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

const TOKEN_MESSAGE = 'jailbreak-vercel:access:v1';

function base64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64Url(signature);
}

export function isAccessGateEnabled(): boolean {
  return Boolean(process.env.ACCESS_PASSWORD);
}

export async function createAccessToken(): Promise<string | null> {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) return null;

  return `v1.${await sign(TOKEN_MESSAGE, password)}`;
}

export async function isValidAccessToken(token: string | undefined): Promise<boolean> {
  if (!isAccessGateEnabled()) return true;
  if (!token) return false;

  const expected = await createAccessToken();
  return token === expected;
}
