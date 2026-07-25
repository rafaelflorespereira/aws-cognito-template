# Running the VS Helper on iOS

How to serve the **`apps/vs-helper`** app on iOS. Expo Go can exercise the
offline UI, while Cognito Apple/Google OAuth requires the EAS development build.
For the one-time provider setup see [`deployment.md`](deployment.md).

> This is a **monorepo** (npm workspaces). Dependencies are hoisted to the root
> `node_modules`, and Metro is configured to watch the workspace root so it can
> resolve the shared `@vs/auth` and `@vs/shared` packages. Always install from
> the **repo root**.

## Prerequisites

- **Node.js** 18+ and npm
- **Expo Go** app on your iPhone (optional, offline UI testing only)
- **Expo account** and the EAS development build for Cognito sign-in
- **Xcode** + iOS Simulator — for Simulator testing (macOS only)
- Mac and iPhone on the **same Wi‑Fi network** (physical device)

## 1. Install dependencies (from the repo root)

```bash
# from the repository root, NOT from apps/vs-helper
npm install
```

This installs and hoists dependencies for every workspace, including
`apps/vs-helper` and `packages/auth`. Running `npm install` inside the app
folder is not enough in a workspace setup.

## 2. Create the app's `.env`

Environment variables live in the **consuming app**, not in `packages/auth`.
Metro only inlines the `.env` from the project root of the app you run.

```bash
cd apps/vs-helper
cp .env.example .env
```

Fill in the OIDC values from the Cognito console
("Add the example code to your application"):

| `.env` variable                   | Notes                                       |
| --------------------------------- | ------------------------------------------- |
| `EXPO_PUBLIC_COGNITO_ISSUER`      | Pool issuer URL                             |
| `EXPO_PUBLIC_USER_POOL_CLIENT_ID` | Public App Client ID (PKCE, no secret)      |
| `EXPO_PUBLIC_LOGOUT_URI`          | `vshelper://` (optional)                    |
| `EXPO_PUBLIC_APP_SCHEME`          | `vshelper` (matches `scheme` in `app.json`) |
| `EXPO_PUBLIC_API_BASE_URL`        | Optional — cloud sync backend URL (see [`vs-helper-backend.md`](vs-helper-backend.md)); leave unset to run fully on-device |

All `EXPO_PUBLIC_*` values are inlined into the bundle at build time — they are
public, not secrets.

## 3. Run the offline UI in Expo Go (optional)

```bash
# from the repo root
npm run vs
# or, equivalently, from apps/vs-helper:
#   npm start
```

Then:

- **iOS Simulator** — press `i` in the Expo CLI, or run `npm run ios` from
  `apps/vs-helper`.
- **Physical iPhone** — open the **Camera** app, scan the QR code in the
  terminal, and open it in **Expo Go**.

## 4. Build the development client for sign-in

Expo Go cannot receive OAuth/OIDC redirects. Build and install the project's
development client once:

```bash
cd apps/vs-helper
npx eas-cli device:create
# Select Website, open the generated link on the iPhone, and install the profile.
npx eas-cli build --profile development --platform ios
```

Install the resulting build on the iPhone, then start Metro from the repo root:

```bash
npm run vs:dev
```

In Cognito, register `vshelper://callback` as the callback URL and
`vshelper://` as the sign-out URL. The development and production builds use the
same custom scheme.

## Troubleshooting

| Symptom                                    | Fix                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **App stuck "loading" forever in Expo Go** | Dependencies not installed — run `npm install` from the **repo root** (not the app folder).      |
| Metro can't resolve `@vs/auth`             | Start from the repo root so Metro watches the workspace; confirm `metro.config.js` is unchanged. |
| Physical iPhone can't reach the dev server | Same Wi‑Fi; try `npm run vs:dev:tunnel` if on a restricted network.                             |
| Env vars are `undefined` at runtime        | `.env` must be in `apps/vs-helper/`, not `packages/auth/`. Restart Metro after editing `.env`.   |
| Sign-in buttons are disabled in Expo Go    | Install the development build and start it with `npm run vs:dev`.                                |
| `redirect_uri` error on the login page     | Cognito must allow the exact callback `vshelper://callback`.                                     |
| Changes to `.env` not picked up            | Stop Metro and restart with a cleared cache: `npx expo start -c`.                                |

## Production build (EAS)

For TestFlight / App Store builds instead of the development client, see
[`vs-helper-app-store.md`](vs-helper-app-store.md).
