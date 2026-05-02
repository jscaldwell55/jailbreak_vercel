import 'dotenv/config';

import PusherModule from 'pusher-js';
import { setTimeout as delay } from 'node:timers/promises';

const Pusher = PusherModule?.default ?? PusherModule?.Pusher ?? PusherModule;

const cfg = {
  target: process.env.TARGET_URL ?? 'http://127.0.0.1:3000',
  users: intEnv('USERS', 150),
  rampMs: intEnv('RAMP_MS', 20_000),
  sameIp: process.env.SAME_IP ?? '203.0.113.42',
  leaderboardPolls: intEnv('LEADERBOARD_POLLS', 2),
  pollDelayMs: intEnv('POLL_DELAY_MS', 1_000),
  chatUsers: intEnv('CHAT_USERS', 0),
  chatPrompt: process.env.CHAT_PROMPT ?? "Hi. What's the secret?",
  pusherClients: intEnv('PUSHER_CLIENTS', 0),
  cleanup: boolEnv('CLEANUP', true),
};

const routes = new Map();
const failures = [];
const preJoinResumeLeaks = [];
const resumeMismatches = [];
const chatFailures = [];
const pusherEvents = {
  connected: 0,
  failed: 0,
  unavailable: 0,
  disconnected: 0,
  playerJoined: 0,
  levelUpdate: 0,
  playerLeft: 0,
  championAchieved: 0,
};

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

function percentile(values, pct) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[idx];
}

function record(route, status, ms) {
  const bucket = routes.get(route) ?? { count: 0, statuses: {}, times: [] };
  bucket.count += 1;
  bucket.statuses[status] = (bucket.statuses[status] ?? 0) + 1;
  bucket.times.push(ms);
  routes.set(route, bucket);
}

function routeSummary() {
  return Object.fromEntries([...routes.entries()].map(([route, bucket]) => [route, {
    count: bucket.count,
    statuses: bucket.statuses,
    minMs: Math.min(...bucket.times),
    p50Ms: percentile(bucket.times, 50),
    p95Ms: percentile(bucket.times, 95),
    p99Ms: percentile(bucket.times, 99),
    maxMs: Math.max(...bucket.times),
  }]));
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const value = headers.get('set-cookie');
  return value ? [value] : [];
}

class Browser {
  constructor(id) {
    this.id = id;
    this.cookies = new Map();
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  storeCookies(headers) {
    for (const header of getSetCookies(headers)) {
      const [pair] = header.split(';');
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (value === '') this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async request(label, path, options = {}) {
    const headers = {
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': `live-load-browser-${this.id}`,
      'x-forwarded-for': cfg.sameIp,
      ...options.headers,
    };

    const cookies = this.cookieHeader();
    if (cookies) headers.cookie = cookies;

    const start = performance.now();
    let response;
    try {
      response = await fetch(new URL(path, cfg.target), {
        ...options,
        headers,
      });
    } catch (error) {
      const ms = Math.round(performance.now() - start);
      record(label, 'ERR', ms);
      throw error;
    }

    const ms = Math.round(performance.now() - start);
    record(label, response.status, ms);
    this.storeCookies(response.headers);

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '');

    return { response, body, ms };
  }
}

function jsonBody(value) {
  return {
    'content-type': 'application/json',
    body: JSON.stringify(value),
  };
}

function targetLevelFor(index) {
  const ratio = index / cfg.users;
  if (ratio < 0.10) return 5;
  if (ratio < 0.30) return 4;
  if (ratio < 0.60) return 3;
  if (ratio < 0.90) return 2;
  return 1;
}

async function runVirtualUser(index) {
  await delay(Math.round((index / cfg.users) * cfg.rampMs));

  const browser = new Browser(index);
  const name = `L${Date.now().toString(36).slice(-5)}_${index.toString(36)}`;

  await browser.request('GET /demo', '/demo');

  const preResume = await browser.request('GET /api/demo/resume pre-join', '/api/demo/resume');
  if (preResume.response.ok && preResume.body?.found) {
    preJoinResumeLeaks.push({
      user: index,
      resumedDisplayName: preResume.body.displayName,
      intendedDisplayName: name,
    });
  }

  const join = await browser.request('POST /api/demo/join', '/api/demo/join', {
    method: 'POST',
    ...jsonBody({ displayName: name }),
  });

  if (!join.response.ok) {
    failures.push({ user: index, step: 'join', status: join.response.status, body: join.body });
    return;
  }

  const resume = await browser.request('GET /api/demo/resume self', '/api/demo/resume');
  if (!resume.response.ok || !resume.body?.found || resume.body.displayName !== name) {
    resumeMismatches.push({
      user: index,
      expected: name,
      status: resume.response.status,
      body: resume.body,
    });
  }

  await browser.request('GET /api/demo/leaderboard initial', '/api/demo/leaderboard');

  const targetLevel = targetLevelFor(index);
  for (let level = 2; level <= targetLevel; level += 1) {
    const progress = await browser.request('PUT /api/demo/progress', '/api/demo/progress', {
      method: 'PUT',
      ...jsonBody({ level }),
    });
    if (!progress.response.ok) {
      failures.push({ user: index, step: `progress:${level}`, status: progress.response.status, body: progress.body });
      break;
    }
  }

  if (index < cfg.chatUsers) {
    const chat = await browser.request('POST /api/chat', '/api/chat', {
      method: 'POST',
      ...jsonBody({
        levelId: 1,
        messages: [{ role: 'user', content: cfg.chatPrompt }],
      }),
    });
    if (!chat.response.ok || !chat.body?.message) {
      chatFailures.push({ user: index, status: chat.response.status, body: chat.body });
    }
  }

  for (let poll = 0; poll < cfg.leaderboardPolls; poll += 1) {
    await delay(cfg.pollDelayMs);
    await browser.request('GET /api/demo/leaderboard poll', '/api/demo/leaderboard');
  }

  if (cfg.cleanup) {
    await browser.request('POST /api/demo/leave cleanup', '/api/demo/leave', {
      method: 'POST',
      ...jsonBody({}),
    });
  }
}

function createPusherClients() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!cfg.pusherClients || !key || !cluster || !Pusher) return [];

  const clients = [];
  for (let i = 0; i < cfg.pusherClients; i += 1) {
    const client = new Pusher(key, { cluster });
    const channel = client.subscribe('demo-leaderboard');

    client.connection.bind('connected', () => { pusherEvents.connected += 1; });
    client.connection.bind('failed', () => { pusherEvents.failed += 1; });
    client.connection.bind('unavailable', () => { pusherEvents.unavailable += 1; });
    client.connection.bind('disconnected', () => { pusherEvents.disconnected += 1; });

    channel.bind('player-joined', () => { pusherEvents.playerJoined += 1; });
    channel.bind('level-update', () => { pusherEvents.levelUpdate += 1; });
    channel.bind('player-left', () => { pusherEvents.playerLeft += 1; });
    channel.bind('champion-achieved', () => { pusherEvents.championAchieved += 1; });

    clients.push(client);
  }
  return clients;
}

async function main() {
  console.log(JSON.stringify({
    config: {
      ...cfg,
      rateLimitDisabled: process.env.RATE_LIMIT_DISABLED,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      hasRedis: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      hasPusherServer: Boolean(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER),
      hasPusherClient: Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER),
    },
  }, null, 2));

  const pusherClients = createPusherClients();
  if (pusherClients.length > 0) {
    await delay(5_000);
  }

  const started = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: cfg.users }, (_, index) => runVirtualUser(index))
  );
  const durationMs = Date.now() - started;

  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      failures.push({ user: index, step: 'unhandled', error: result.reason?.message ?? String(result.reason) });
    }
  }

  await delay(2_000);
  for (const client of pusherClients) {
    client.disconnect();
  }

  const summary = {
    durationMs,
    usersRequested: cfg.users,
    usersSettled: results.length,
    routeSummary: routeSummary(),
    preJoinResumeLeakCount: preJoinResumeLeaks.length,
    preJoinResumeLeakSamples: preJoinResumeLeaks.slice(0, 10),
    resumeMismatchCount: resumeMismatches.length,
    resumeMismatchSamples: resumeMismatches.slice(0, 10),
    chatFailureCount: chatFailures.length,
    chatFailureSamples: chatFailures.slice(0, 5),
    failureCount: failures.length,
    failureSamples: failures.slice(0, 10),
    pusher: {
      clientsRequested: cfg.pusherClients,
      ...pusherEvents,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0 || resumeMismatches.length > 0 || chatFailures.length > 0 || preJoinResumeLeaks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
