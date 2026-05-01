# jailbreak_vercel

One-shot Vercel deployment of **Demo mode only** from `jailbreak_demo`, for a live event the week of 2026-05-08. Source repo (current `main`) has migrated to Valkey + SSE + Postgres for a GKE/Cloud Run target — none of that works on Vercel serverless. This project restores the original Vercel-era stack (Upstash Redis + Pusher + OpenAI) and strips Play mode entirely.

## Source

- Source repo: `/Users/jay.caldwell/jailbreak_demo` (branch `pr-10` is fine)
- Treat the source as read-only reference; copy in, then mutate locally.

## Stack (final)

| Concern | Choice 
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript (unchanged) |
| Storage | Upstash Redis (`@upstash/redis` REST client) |
| Rate limit | `@upstash/ratelimit` |
| Realtime | Pusher Channels (`pusher` server + `pusher-js` client) |
| LLM | OpenAI direct API |
| Auth | None — Demo is unauthenticated |
| Persistent DB | None — Demo is ephemeral |
| Deploy | Vercel |

Why this combo: it's the original pre-Valkey shape (commit `517e260` in source is what tore it out). Upstash REST and Pusher are both serverless-safe; no long-lived connections.

## Build decisions

1. **Rate limits.** Keep source values by default (`chat:demo` 60/min per session, `demo-join` 5/min per IP), but add `RATE_LIMIT_DISABLED=true` / `1` as an event kill switch that bypasses rate limiting.
2. **Game gate / username rules.** Keep source display name rules: 3–20 chars matching `[a-zA-Z0-9_]`.

Both decisions have been applied in this target project.

## Credentials to provision (user does this; agent waits)

Create accounts and capture these env vars into `.env.local` (and Vercel project env vars later):

```
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=     # same as PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER= # same as PUSHER_CLUSTER
RATE_LIMIT_DISABLED=false   # set true/1 during events for effectively unlimited chat/join
```

Setup paths:

- **OpenAI**: https://platform.openai.com/api-keys — create a key scoped to this project, fund it. Models used: `gpt-3.5-turbo`, `gpt-4o-mini`, `gpt-4o`. Estimate generously for a live audience.
- **Upstash Redis**: https://console.upstash.com → Create Database → Global, free tier is fine for an event. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the REST API panel.
- **Pusher Channels**: https://dashboard.pusher.com → Channels → Create app → free Sandbox tier. Capture `app_id`, `key`, `secret`, `cluster`. Channel name will be `demo-leaderboard` (single channel, public).
- **Vercel**: https://vercel.com → import the GitHub repo (or `vercel` CLI from project root). Add all env vars to the project before first deploy.

## Build to-do list

Run these top-to-bottom. Source paths assume `/Users/jay.caldwell/jailbreak_demo`; target is `/Users/jay.caldwell/Desktop/jailbreak_vercel`.

### Phase 0 — Confirm decisions
- [x] Get answers to rate-limit and game-gate questions above.

### Phase 1 — Scaffold
- [ ] `git init` in this directory.
- [ ] Copy keep-list from source (see "Keep" section below).
- [ ] Author fresh `package.json` (see "Dependencies" section).
- [ ] Author `.env.example` listing the variables in the credentials section above (no values).
- [ ] `npm install`.

### Phase 2 — Strip / rewrite
- [ ] Delete `lib/db/`, `lib/auth.ts`, `lib/realtime.server.ts`, `lib/valkey.ts` from copied tree.
- [ ] Delete `app/api/{auth,csrf,logout,user}/`, `app/api/demo/events/`, `app/login/`, `app/play/`.
- [ ] Delete `middleware.ts`, `drizzle.config.ts`, `tsup.migrate.ts`.
- [ ] Delete `hooks/useCsrf.ts`, `hooks/useUserMode.ts`, `hooks/useSSE.ts`.
- [ ] Delete `services/`.
- [ ] Trim `__tests__/` to demo + chat tests only; drop everything touching auth, CSRF, Play, db, valkey, realtime SSE.
- [ ] Trim `lib/levels.server.ts`: remove `PLAY_LEVELS` and the `mode` arg in `getLevel`.

### Phase 3 — New libs
- [ ] Write `lib/redis.ts` — Upstash REST client, exports `getRedis()`, `DEMO_TTL = 7200`, `DEMO_KEYS` (same shape as source's `valkey.ts`).
- [ ] Write `lib/pusher.server.ts` — server `Pusher` client, exports `pusher`, `CHANNEL = 'demo-leaderboard'`, `EVENTS` (same names as source's `realtime.server.ts`: `player-joined`, `level-update`, `player-left`, `champion-achieved`), `publishEvent(event)`.
- [ ] Write `lib/pusher.client.ts` — exports `getPusherClient()` reading `NEXT_PUBLIC_PUSHER_*`.
- [ ] Rewrite `lib/demo-session.ts` against Upstash + Pusher (same exported API: `isNameAvailable`, `createDemoSession`, `getDemoSession`, `getDemoSessionByIP`, `updateDemoLevel`, `markDemoChampion`, `getLeaderboard`, `removeDemoSession`). Replace ioredis ops with Upstash equivalents (`hset`/`hgetall`/`zadd`/`zrange`/`setnx`/`expire`/`del`/`zrem`). Replace `publishEvent` import to point at `pusher.server`.
- [ ] Rewrite `lib/rate-limit.ts` using `@upstash/ratelimit` — same `RateLimitType` union (`chat`, `chat:demo`, `auth` (drop), `demo-join`), same `checkRateLimit(type, identifier)` signature, same `getClientIP` helper. Apply Phase-0 decisions for points/duration here.

### Phase 4 — API routes
- [ ] `app/api/chat/route.ts` — strip the Play branch and CSRF dependency; keep level-5 backdoor; demo session is required (404 / 401 if no `demo_session` cookie).
- [ ] `app/api/demo/join/route.ts` — drop CSRF check; use new lib/demo-session.
- [ ] `app/api/demo/resume/route.ts` — same.
- [ ] `app/api/demo/leaderboard/route.ts` — same.
- [ ] `app/api/demo/progress/route.ts` — drop CSRF; read `demo_session` cookie directly (no middleware header).
- [ ] `app/api/demo/leave/route.ts` — same.
- [ ] `app/api/demo/champion/route.ts` — same.
- [ ] No `events/` route — Pusher handles realtime client-side.

### Phase 5 — Client
- [ ] `hooks/useDemoMode.ts` — replace `fetchWithCsrf` with plain `fetch`; everything else unchanged.
- [ ] `hooks/useDemoLeaderboard.ts` — replace SSE subscriber with Pusher subscribe to `demo-leaderboard` channel; keep polling fallback at ~10s interval.
- [ ] `app/page.tsx` — keep only the Demo CTA (or auto-redirect to `/demo`).
- [ ] `app/demo/page.tsx` — unchanged after CSRF removal.

### Phase 6 — Verify
- [ ] `npm run build` clean.
- [ ] `npm run test` (whatever survives) green.
- [ ] Local smoke test with real Upstash + Pusher creds: join → chat → beat L1 → see leaderboard update from a second incognito tab in real time.

### Phase 7 — Ship
- [ ] Push to GitHub.
- [ ] Import to Vercel, set env vars, deploy.
- [ ] Live smoke test on the Vercel URL.
- [ ] Hand URL to user with notes on rate limits and known L5 backdoor.

## Keep (copy from source)

```
app/layout.tsx
app/globals.css
app/favicon.ico
app/page.tsx                          (will edit)
app/demo/page.tsx                     (will edit lightly)
app/api/chat/route.ts                 (will edit)
app/api/demo/{join,resume,leaderboard,progress,leave,champion}/route.ts  (will edit)
components/ChatInput.tsx
components/ChatMessage.tsx
components/DemoLeaderboard.tsx
components/ErrorBoundary.tsx
components/GameContainer.tsx
components/HintsPanel.tsx
components/Icons.tsx
components/LevelSelector.tsx
components/MissionBriefing.tsx
components/SuccessModal.tsx
components/UsernameModal.tsx
components/ui/{Badge,Button,Card,Input}.tsx
hooks/useDemoMode.ts                  (will edit — drop CSRF)
hooks/useDemoLeaderboard.ts           (will edit — Pusher)
hooks/useGameState.ts
lib/cn.ts
lib/constants.ts
lib/levels.server.ts                  (will edit — drop PLAY_LEVELS)
public/                               (whatever's there)
next.config.ts
tsconfig.json
postcss.config.mjs
eslint.config.mjs
vitest.config.ts                      (if keeping tests)
```

## Dependencies (target package.json)

```json
{
  "dependencies": {
    "@upstash/redis": "^1",
    "@upstash/ratelimit": "^2",
    "pusher": "^5",
    "pusher-js": "^8",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "uuid": "^11",
    "server-only": "^0.0.1",
    "canvas-confetti": "^1.9.4",
    "@types/canvas-confetti": "^1.9.0"
  }
}
```

Drop from source: `drizzle-orm`, `drizzle-kit`, `postgres`, `ioredis`, `jose`, `rate-limiter-flexible`, `tsup`, `tsx`. Keep dev deps for typescript, eslint, vitest, tailwind, testing-library.

## Channel + event contract (Pusher)

- Channel: `demo-leaderboard` (public)
- Events emitted by server, consumed by client:
  - `player-joined` → `{ sessionId, displayName, level }`
  - `level-update` → `{ sessionId, displayName, level }`
  - `player-left` → `{ sessionId }`
  - `champion-achieved` → `{ sessionId, displayName, isChampion: true }`

Same contract as `/Users/jay.caldwell/jailbreak_demo/lib/realtime.server.ts` so the client hook diff stays small.

## Notes / gotchas 

- Upstash REST `hset` accepts an object; map source's `redis.hset(key, { ... })` calls directly.
- Upstash `zrange` with `WITHSCORES` returns `[{ member, score }]`, not the ioredis flat array — adjust `getLeaderboard` parsing.
- `setnx` on Upstash returns `0`/`1` (not boolean). Cast accordingly.
- Vercel functions default to 10s max duration on hobby; chat calls to GPT-4o can flirt with that. Set `export const maxDuration = 30` on `app/api/chat/route.ts` and bump Vercel plan if needed for the event.
- Pusher Sandbox cap: 100 concurrent connections, 200k messages/day. Fine for an event room; flag if expecting >100 simultaneous players.
- Level 5 has a hardcoded backdoor in `chat/route.ts` (function-call extraction trigger). Leave it in for the demo — it's the intended "win" path.

## Useful source references

- Demo session logic: `/Users/jay.caldwell/jailbreak_demo/lib/demo-session.ts`
- Realtime contract: `/Users/jay.caldwell/jailbreak_demo/lib/realtime.server.ts`
- Chat route incl. L5 backdoor: `/Users/jay.caldwell/jailbreak_demo/app/api/chat/route.ts`
- Levels + secrets: `/Users/jay.caldwell/jailbreak_demo/lib/levels.server.ts`
- Demo page wiring: `/Users/jay.caldwell/jailbreak_demo/app/demo/page.tsx`
