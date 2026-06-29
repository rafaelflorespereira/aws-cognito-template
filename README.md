# AWS Cognito + Google SSO — Expo Template

A production-ready authentication template using **AWS Cognito** with **Google OAuth 2.0** (Single Sign-On), built with **Expo** (React Native) and AWS CDK v2.

## Features

- Google SSO via AWS Cognito Federated Identity
- Authorization Code + PKCE flow via `expo-auth-session`
- Tokens stored securely in device keychain (`expo-secure-store`)
- Automatic token refresh
- AWS CDK v2 infrastructure-as-code
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
│   └── deployment.md            # Deployment guide (EAS Build + CDK)
├── infrastructure/
│   └── cdk/                     # AWS CDK v2 (Cognito User Pool + Google IdP)
│       ├── bin/app.ts
│       ├── lib/cognito-stack.ts
│       ├── package.json
│       └── tsconfig.json
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

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Runtime |
| Expo CLI | latest | `npm i -g expo` |
| AWS CLI | ≥ 2.x | Deploy infrastructure |
| AWS CDK | ≥ 2.x | `npm i -g aws-cdk` |
| Google Cloud account | — | OAuth credentials |

## Quick Start

### 1. Set up Google OAuth credentials

Follow [`docs/setup-google-sso.md`](docs/setup-google-sso.md).

### 2. Choose your app name

Edit `infrastructure/cdk/bin/app.ts` and change `appName` to something unique — it becomes your Cognito domain prefix.

Also update the `scheme` in `mobile/app.json` if you change the deep link scheme from `myapp`.

### 3. Deploy Cognito infrastructure

```bash
cd infrastructure/cdk
npm install
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
npm run bootstrap   # first time only
npm run deploy
```

Copy the `UserPoolClientId` and `CognitoDomain` from the outputs.

### 4. Configure the mobile app

```bash
cd mobile
cp .env.example .env
# fill in values from CDK outputs
npm install
```

### 5. Run

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Tap **Sign in with Google** — the system browser opens, you authenticate, and the app receives the tokens via deep link.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `EXPO_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID (from CDK output) |
| `EXPO_PUBLIC_COGNITO_DOMAIN` | Cognito domain prefix (e.g. `my-app`) |
| `EXPO_PUBLIC_APP_SCHEME` | Must match `app.json → expo.scheme` (`myapp`) |

## Documentation

- [Architecture](docs/architecture.md)
- [Google SSO Setup](docs/setup-google-sso.md)
- [Deployment](docs/deployment.md)

## License

MIT
