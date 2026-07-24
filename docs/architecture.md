# Architecture

## Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Device                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Expo App (apps/vs-helper/)                │  │
│  │                                                        │  │
│  │  expo-auth-session                                     │  │
│  │   - builds authorization URL + PKCE code challenge     │  │
│  │   - opens Cognito Hosted UI in system browser          │  │
│  │   - listens for deep link: vshelper://callback          │  │
│  │                                                        │  │
│  │  expo-secure-store                                     │  │
│  │   - stores ID / Access / Refresh tokens in keychain    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              System Browser                            │  │
│  │   Cognito Hosted UI → Apple / Google → redirect back  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      AWS Cloud                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            Cognito User Pool                           │  │
│  │                                                        │  │
│  │  App Client (public — no secret, PKCE only)           │  │
│  │   - responseType: code                                 │  │
│  │   - scopes: openid, email, profile                     │  │
│  │   - callbackUrls: vshelper://callback                  │  │
│  │                     exp://localhost:8081/--/callback   │  │
│  │                                                        │  │
│  │  Google Identity Provider                              │  │
│  │   - Client ID + Secret from Google Cloud Console       │  │
│  │   - Attribute mappings: email, name, picture           │  │
│  │                                                        │  │
│  │  Sign in with Apple Identity Provider                   │  │
│  │   - Services ID + private key from Apple Developer      │  │
│  │   - Attribute mappings: email, name                     │  │
│  │                                                        │  │
│  │  Hosted UI Domain                                      │  │
│  │   <prefix>.auth.<region>.amazoncognito.com             │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                            │ OIDC Federation                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Apple ID / Google OAuth                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Authorization Code + PKCE Flow

```
App                  System Browser       Cognito Hosted UI    Apple / Google
 │                         │                     │                  │
 │──promptAsync()──────────▶                     │                  │
 │  (opens browser)        │──navigate──────────▶│                  │
 │                         │                     │──redirect───────▶│
 │                         │                     │                  │
 │                         │                     │◀──auth code──────│
 │                         │◀─vshelper://callback─│                  │
 │◀──deep link received────│  (?code=...)        │                  │
 │                         │                     │                  │
 │──exchangeCodeAsync()────────────────────────▶│                  │
 │  (code + code_verifier)                       │                  │
 │◀──ID + Access + Refresh tokens────────────────│                  │
 │                         │                     │                  │
 │ save to SecureStore      │                     │                  │
```

## Token Lifecycle

| Token              | TTL     | Storage             | Usage                                |
| ------------------ | ------- | ------------------- | ------------------------------------ |
| ID Token (JWT)     | 1 hour  | `expo-secure-store` | User identity (email, optional name/picture) |
| Access Token (JWT) | 1 hour  | `expo-secure-store` | Call protected APIs                  |
| Refresh Token      | 30 days | `expo-secure-store` | Renew ID + Access tokens             |

Call `refreshAccessToken()` from `src/lib/auth.ts` before the Access Token expires.

## Redirect URI by Environment

| Environment                | Redirect URI                   |
| -------------------------- | ------------------------------ |
| iOS Simulator (Expo Go)    | `exp://localhost:8081/--/callback`         |
| Android Emulator (Expo Go) | `exp://10.0.2.2:8081/--/callback`          |
| Physical device (Expo Go)  | `exp://<your-machine-ip>:8081/--/callback` |
| Standalone / EAS Build     | `vshelper://callback`                       |

`expo-auth-session`'s `makeRedirectUri()` resolves the correct URI at runtime automatically.

## Cognito Resources (configured in the AWS Console)

| Resource                       | Purpose                               |
| ------------------------------ | ------------------------------------- |
| User Pool                      | User directory                        |
| Cognito domain                 | Hosted UI domain                      |
| Google identity provider       | Google federation                     |
| Sign in with Apple provider    | Apple federation and private relay email |
| App Client                     | Public OAuth client (no secret, PKCE) |

## Security Notes

- No client secret — the App Client is a public client using PKCE only.
- Tokens are stored in the native keychain (iOS Keychain / Android Keystore) via `expo-secure-store`.
- The code verifier never leaves the device; only the code challenge is sent to Cognito.
- Sign in with Apple users can keep their personal email private; Cognito receives
  only the Apple relay address in that case.
- In production, restrict `callbackUrls` to only `vshelper://callback`.
