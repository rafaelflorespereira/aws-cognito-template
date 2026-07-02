# AWS Cognito + Google SSO — Expo Template

A production-ready authentication template using **AWS Cognito** with **Google OAuth 2.0** (Single Sign-On), built with **Expo** (React Native). The Cognito User Pool is configured directly in the **AWS Console**.

## Features

- Google SSO via AWS Cognito Federated Identity
- Authorization Code + PKCE flow via `expo-auth-session`
- Tokens stored securely in device keychain (`expo-secure-store`)
- Automatic token refresh
- TypeScript throughout

## OAuth Flow

```
User taps "Sign in with Google"
        ↓
expo-auth-session opens Cognito Hosted UI in system browser
        ↓
Cognito redirects to Google for authentication
        ↓
Google returns auth code to Cognito
        ↓
Cognito redirects to myapp://callback (deep link)
        ↓
OS hands deep link back to the app
        ↓
App exchanges code for tokens (ID, Access, Refresh)
        ↓
Tokens saved to secure keychain — user is signed in
```

## Project Structure

```
aws-cognito/
├── docs/
│   ├── architecture.md          # Component diagram + token lifecycle
│   └── deployment.md            # Full setup: Cognito + Google SSO + EAS Build
└── mobile/                      # Expo app
    ├── app/
    │   ├── _layout.tsx          # Root layout
    │   └── index.tsx            # Home screen (auth state)
    ├── src/
    │   ├── lib/
    │   │   ├── cognito.ts       # Discovery doc + redirect URI
    │   │   └── auth.ts          # Token exchange, storage, parsing
    │   └── components/
    │       ├── LoginButton.tsx
    │       └── UserProfile.tsx
    ├── app.json                 # Expo config (scheme: "myapp")
    └── .env.example
```

## Prerequisites

| Tool                 | Version | Purpose                     |
| -------------------- | ------- | --------------------------- |
| Node.js              | ≥ 20    | Runtime                     |
| Expo CLI             | latest  | `npm i -g expo`             |
| AWS account          | —       | Cognito User Pool (console) |
| Google Cloud account | —       | OAuth credentials           |

## Quick Start

Follow [`docs/deployment.md`](docs/deployment.md) — a single step-by-step guide
covering the Cognito User Pool, Google OAuth credentials, the App Client, the
mobile `.env`, and EAS Build.

```bash
cd mobile
cp .env.example .env
# fill in the issuer and App Client ID from the console (OIDC properties)
npm install
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Tap **Sign in with Google** — the system browser opens, you authenticate, and the app receives the tokens via deep link.

## Environment Variables

All `EXPO_PUBLIC_*` values are inlined into the app bundle at build time. They are **public, not secrets** — the App Client is a public PKCE client with no secret.

| Variable                          | Description                                                           |
| --------------------------------- | --------------------------------------------------------------------- |
| `EXPO_PUBLIC_COGNITO_ISSUER`      | OIDC issuer `https://cognito-idp.<region>.amazonaws.com/<userPoolId>` |
| `EXPO_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID (App integration tab)                           |
| `EXPO_PUBLIC_LOGOUT_URI`          | Optional hosted-UI sign-out URL (e.g. `myapp://`)                     |
| `EXPO_PUBLIC_APP_SCHEME`          | Must match `app.json → expo.scheme` (`myapp`)                         |

## Documentation

- [Architecture](docs/architecture.md)
- [Setup & Deployment](docs/deployment.md)

## License

MIT
