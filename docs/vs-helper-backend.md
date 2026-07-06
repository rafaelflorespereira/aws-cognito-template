# VS Helper — Cloud Sync Backend (Phase 2)

Deployment guide for the sync API described in
[`vs-helper-architecture.md`](vs-helper-architecture.md) §12. Lives at
`infra/vs-helper-backend` as an AWS CDK (TypeScript) app.

**First-pass scope**: Settings, Sessions and Stats sync only. Reports stay
on-device (they're sensitive/opt-in per the architecture doc) and there's no
leaderboard yet — both are later phases.

## What it deploys

- **DynamoDB** — `SettingsTable`, `SessionsTable`, `StatsTable` (all
  pay-per-request, partitioned by `userId` = the Cognito `sub`). Tables are
  created with `RemovalPolicy.RETAIN`, so `cdk destroy` never deletes user data.
- **Lambda** (Node 20, arm64) — one function per route, bundled with esbuild
  (no Docker required).
- **API Gateway HTTP API** — routes below, protected by a JWT authorizer that
  validates the caller's Cognito **ID token** directly (issuer = the existing
  User Pool, audience = the existing public App Client). No separate Lambda
  authorizer or new Cognito resources are created — this reuses the pool from
  [`deployment.md`](deployment.md).

| Method | Path        | Purpose                                            |
| ------ | ----------- | --------------------------------------------------- |
| GET    | `/settings` | Fetch the caller's synced `VSSettings` (404 if none) |
| PUT    | `/settings` | Upsert settings; last-write-wins via `updatedAt`     |
| POST   | `/sessions` | Append one `SessionRecord`; recomputes `Stats`       |
| GET    | `/stats`    | Fetch the caller's `LifetimeStats` (zeroed if none)  |

`POST /sessions` is idempotent on `completedAt` (a conditional put rejects
duplicates from client retries) and recomputes `LifetimeStats` from the full
session history using the same `computeStats` used on-device — both live in
the shared `@vs/shared` workspace package so the app and backend can't drift.

## 1. Prerequisites

- An existing Cognito User Pool + public PKCE App Client (see
  [`deployment.md`](deployment.md)) — note the **User Pool ID** and
  **App Client ID**.
- AWS CLI credentials for the target account (`aws configure` or SSO).
- One-time per account/region: `npx cdk bootstrap` (from
  `infra/vs-helper-backend`).

## 2. Configure

```bash
cd infra/vs-helper-backend
cp .env.example .env
# fill in VS_USER_POOL_ID, VS_USER_POOL_CLIENT_ID, CDK_DEFAULT_REGION
```

## 3. Deploy

```bash
npm run synth --workspace vs-helper-backend   # sanity-check the CloudFormation
npm run deploy --workspace vs-helper-backend
```

Note the `ApiUrl` output — that's the base URL the app will call.

## 4. Verify

```bash
# Should be 401 (no token):
curl -i https://<api-id>.execute-api.<region>.amazonaws.com/stats

# With a real ID token from the app (see packages/auth getStoredTokens()):
curl -i https://<api-id>.execute-api.<region>.amazonaws.com/stats \
  -H "Authorization: Bearer <idToken>"
```

## App wiring

`apps/vs-helper/src/features/vs/sync.ts` is a thin client the app now uses:

- **Settings** — `useSchedule.updateSettings()` pushes every local edit
  (fire-and-forget); on app launch and right after sign-in
  (`app/(tabs)/account.tsx`), `syncSettingsNow()` pulls the server copy and
  applies it if newer (by `updatedAt`), otherwise pushes the local copy up.
- **Sessions** — `useSchedule.completeCurrent()` pushes each finished session
  (fire-and-forget) so the server's `Stats` stay current.
- Everything degrades to a silent no-op when signed out, offline, or
  `EXPO_PUBLIC_API_BASE_URL` is unset — local storage stays the source of
  truth the UI always reads from.

## Not done yet

- **Stats/history aren't pulled** — `stats.tsx` still computes `LifetimeStats`
  from local history only. Session history itself isn't merged across
  devices (each device's local history is its own baseline); only settings
  sync bidirectionally today.
- **Reports & UserAchievements sync** — deferred; still on-device only.
- **Leaderboard** (Phase 3) — the `Stats` table has no GSI yet; adding
  `gsi1pk`/`gsi1sk` and the opt-in `Users` table comes with that phase.
