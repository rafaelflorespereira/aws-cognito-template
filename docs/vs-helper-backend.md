# VS Helper — Cloud Sync Backend (Phase 2 + Phase 3 leaderboard)

Deployment guide for the sync API described in
[`vs-helper-architecture.md`](vs-helper-architecture.md) §12. Lives at
`infra/vs-helper-backend` as an AWS CDK (TypeScript) app.

**Scope**: Settings, Sessions and Stats sync (Phase 2), plus the opt-in
**leaderboard** (Phase 3, §11). Reports stay on-device (sensitive/opt-in);
situational reminders and group mode are not built.

## What it deploys

- **DynamoDB** — `SettingsTable`, `SessionsTable`, `StatsTable`, `UsersTable`
  (all pay-per-request, partitioned by `userId` = the Cognito `sub`). Tables
  are created with `RemovalPolicy.RETAIN`, so `cdk destroy` never deletes user
  data. `StatsTable` has a `gsi1` GSI (`gsi1pk`/`gsi1sk`) that only opted-in
  users are indexed on — that's the leaderboard.
- **Lambda** (Node 20, arm64) — one function per route, bundled with esbuild
  (no Docker required).
- **API Gateway HTTP API** — routes below, protected by a JWT authorizer that
  validates the caller's Cognito **ID token** directly (issuer = the existing
  User Pool, audience = the existing public App Client). No separate Lambda
  authorizer or new Cognito resources are created — this reuses the pool from
  [`deployment.md`](deployment.md).

| Method | Path          | Purpose                                                |
| ------ | ------------- | ------------------------------------------------------- |
| GET    | `/settings`   | Fetch the caller's synced `VSSettings` (404 if none)   |
| PUT    | `/settings`   | Upsert settings; last-write-wins via `updatedAt`       |
| GET    | `/sessions`   | Fetch the caller's full `SessionRecord[]` history      |
| POST   | `/sessions`   | Append one `SessionRecord`; recomputes `Stats`         |
| GET    | `/stats`      | Fetch the caller's `LifetimeStats` (zeroed if none)    |
| GET    | `/profile`    | Fetch the caller's handle + leaderboard opt-in         |
| PUT    | `/profile`    | Upsert handle + opt-in; keeps `Stats`' GSI fields in sync |
| GET    | `/leaderboard`| Top 50 opted-in users by `totalSessions`, descending   |

`POST /sessions` is idempotent on `completedAt` (a conditional put rejects
duplicates from client retries) and recomputes `LifetimeStats` from the full
session history using the same `computeStats` used on-device — both live in
the shared `@vs/shared` workspace package so the app and backend can't drift.

### Leaderboard mechanics

- `PUT /profile` validates `handle` (3-20 letters/digits/underscores) only
  when `leaderboardOptIn` is `true`, upserts `UsersTable`, then rewrites the
  caller's `Stats` item through `buildStatsItem()` (`src/lib/leaderboard.ts`)
  so `gsi1pk`/`gsi1sk`/`handle` are set (opted in) or absent (opted out) —
  DynamoDB only indexes items that carry the GSI's key attributes, so opting
  out removes the row from the leaderboard automatically.
- `POST /sessions` also runs every `Stats` rewrite through `buildStatsItem()`
  (reading the caller's profile first), so completing a session keeps an
  opted-in user's leaderboard rank current.
- `GET /leaderboard` is a single `Query` on `gsi1`, `ScanIndexForward: false`,
  limited to 50 rows; each entry carries only `handle` + coarse counts plus
  an `isYou` flag — never emails or report details, per the privacy notes in
  the architecture doc.

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
  (fire-and-forget) so the server's `Stats` stay current. On app launch/focus,
  `syncSessionHistoryNow()` pulls the server history and merges by
  `completedAt`, then rewrites local history/progress so dashboards and streaks
  reflect the latest state across devices.
- **Leaderboard** — `app/(tabs)/leaderboard.tsx` (via
  `useLeaderboard()`) pulls the caller's profile and the top-50 entries on
  focus, and pushes handle/opt-in edits through `pushProfile()`. Unlike
  Settings/Sessions this has no local cache: signed-out or offline just shows
  the sign-in prompt or last-fetched list, since leaderboard data isn't
  meaningful on-device.
- Everything degrades to a silent no-op when signed out, offline, or
  `EXPO_PUBLIC_API_BASE_URL` is unset — local storage stays the source of
  truth the UI always reads from for Settings/Sessions.

## Not done yet

- **Reports & UserAchievements sync** — deferred; still on-device only.
- **Situational reminders & group mode** (rest of Phase 3, §10) — not started.
