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
│   ├── setup-google-sso.md      # Step-by-step Google OAuth setup
│   └── deployment.md            # Cognito console setup + EAS Build guide
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

### 1. Set up Google OAuth credentials

Follow [`docs/setup-google-sso.md`](docs/setup-google-sso.md) to create an OAuth 2.0 Client ID and secret in Google Cloud Console.

### 2. Create the Cognito User Pool (AWS Console)

Follow [`docs/deployment.md`](docs/deployment.md#cognito-user-pool-aws-console) —
it covers pool creation, sign-up verification, Managed Login branding, the
App Client, and a troubleshooting table for the errors you're most likely to
hit along the way (several settings are fixed at creation time, so it's
worth reading before you start).

Note the **App Client ID** and **domain prefix** — you'll need them next.

### 3. Configure the mobile app

```bash
cd mobile
cp .env.example .env
# fill in the App Client ID and domain prefix from the console
npm install
```

### 4. Run

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Tap **Sign in with Google** — the system browser opens, you authenticate, and the app receives the tokens via deep link.

## Environment Variables

All `EXPO_PUBLIC_*` values are inlined into the app bundle at build time. They are **public, not secrets** — the App Client is a public PKCE client with no secret.

| Variable                          | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| `EXPO_PUBLIC_AWS_REGION`          | AWS region (e.g. `us-east-1`)                         |
| `EXPO_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID (App integration tab)           |
| `EXPO_PUBLIC_COGNITO_DOMAIN`      | Cognito domain **prefix** (e.g. `us-east-1gdcgzpb1p`) |
| `EXPO_PUBLIC_APP_SCHEME`          | Must match `app.json → expo.scheme` (`myapp`)         |

## Documentation

- [Architecture](docs/architecture.md)
- [Google SSO Setup](docs/setup-google-sso.md)
- [Deployment](docs/deployment.md)

## License

MIT
