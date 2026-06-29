# AWS Cognito + Google SSO Template

A production-ready authentication template using **AWS Cognito** with **Google OAuth 2.0** (Single Sign-On), built with Next.js 14 and AWS Amplify v6.

## Features

- Google SSO via AWS Cognito Federated Identity
- Cognito Hosted UI + custom login page
- JWT-based session management (ID, Access, Refresh tokens)
- Protected routes with server-side auth checks
- AWS CDK v2 infrastructure-as-code
- TypeScript throughout

## Architecture Overview

```
User → Next.js App → AWS Amplify v6
                          ↓
                   AWS Cognito User Pool
                          ↓
                   Google OAuth 2.0 IdP
                          ↓
                   Cognito Hosted UI (authorization code flow)
                          ↓
                   Tokens issued → stored in browser (HTTP-only cookies)
```

**OAuth Flow (Authorization Code + PKCE):**
1. User clicks "Sign in with Google"
2. App redirects to Cognito Hosted UI
3. Cognito redirects to Google for authentication
4. Google returns to Cognito with auth code
5. Cognito exchanges code for tokens and redirects to app callback URL
6. App stores tokens and user is authenticated

## Project Structure

```
aws-cognito/
├── docs/
│   ├── architecture.md          # Detailed architecture diagram
│   ├── setup-google-sso.md      # Step-by-step Google OAuth setup
│   └── deployment.md            # Deployment guide
├── infrastructure/
│   └── cdk/                     # AWS CDK v2 stack (Cognito resources)
│       ├── bin/app.ts
│       ├── lib/cognito-stack.ts
│       ├── package.json
│       └── tsconfig.json
├── frontend/                    # Next.js 14 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Home / protected dashboard
│   │   │   ├── layout.tsx
│   │   │   └── auth/callback/page.tsx  # OAuth callback handler
│   │   ├── components/auth/
│   │   │   ├── LoginButton.tsx
│   │   │   └── UserProfile.tsx
│   │   └── lib/
│   │       ├── amplify.ts       # Amplify configuration
│   │       └── auth.ts          # Auth helper utilities
│   ├── .env.example
│   ├── next.config.ts
│   └── package.json
└── .gitignore
```

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Runtime |
| AWS CLI | ≥ 2.x | Deploy infrastructure |
| AWS CDK | ≥ 2.x | IaC |
| Google Cloud account | — | OAuth credentials |

## Quick Start

### 1. Set up Google OAuth credentials

Follow [`docs/setup-google-sso.md`](docs/setup-google-sso.md) to create a Google OAuth 2.0 Client ID and Secret.

### 2. Deploy Cognito infrastructure

```bash
cd infrastructure/cdk
npm install
npm run bootstrap   # first time only: cdk bootstrap
npm run deploy
```

After deploy, copy the outputs — you'll need `UserPoolId`, `UserPoolClientId`, and `CognitoDomain`.

### 3. Configure the frontend

```bash
cd frontend
cp .env.example .env.local
# fill in values from CDK output
npm install
npm run dev
```

### 4. Open the app

Navigate to `http://localhost:3000` and click **Sign in with Google**.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito Hosted UI domain prefix |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `http://localhost:3000`) |

## Documentation

- [Architecture](docs/architecture.md) — component diagram and token lifecycle
- [Google SSO Setup](docs/setup-google-sso.md) — full step-by-step guide
- [Deployment](docs/deployment.md) — production deployment checklist

## License

MIT
