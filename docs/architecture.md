# Architecture

## Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Device                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Expo App (mobile/)                        │  │
│  │                                                        │  │
│  │  expo-auth-session                                     │  │
│  │   - builds authorization URL + PKCE code challenge     │  │
│  │   - opens Cognito Hosted UI in system browser          │  │
│  │   - listens for deep link: myapp://callback            │  │
│  │                                                        │  │
│  │  expo-secure-store                                     │  │
│  │   - stores ID / Access / Refresh tokens in keychain    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              System Browser                            │  │
│  │   Cognito Hosted UI → Google sign-in → redirect back  │  │
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
│  │   - callbackUrls: myapp://callback                     │  │
│  │                     exp://localhost:8081               │  │
│  │                                                        │  │
│  │  Google Identity Provider                              │  │
│  │   - Client ID + Secret from Google Cloud Console       │  │
│  │   - Attribute mappings: email, name, picture           │  │
│  │                                                        │  │
│  │  Hosted UI Domain                                      │  │
│  │   <prefix>.auth.<region>.amazoncognito.com             │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                            │ OIDC Federation                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Google OAuth 2.0 (accounts.google.com)                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Authorization Code + PKCE Flow

```
App                  System Browser       Cognito Hosted UI    Google
 │                         │                     │               │
 │──promptAsync()──────────▶                     │               │
 │  (opens browser)        │──navigate──────────▶│               │
 │                         │                     │──redirect────▶│
 │                         │                     │               │
 │                         │                     │◀──auth code───│
 │                         │◀──myapp://callback──│               │
 │◀──deep link received────│  (?code=...)        │               │
 │                         │                     │               │
 │──exchangeCodeAsync()────────────────────────▶│               │
 │  (code + code_verifier)                       │               │
 │◀──ID + Access + Refresh tokens────────────────│               │
 │                         │                     │               │
 │ save to SecureStore      │                     │               │
```

## Token Lifecycle

| Token | TTL | Storage | Usage |
|-------|-----|---------|-------|
| ID Token (JWT) | 1 hour | `expo-secure-store` | User identity (email, name, picture) |
| Access Token (JWT) | 1 hour | `expo-secure-store` | Call protected APIs |
| Refresh Token | 30 days | `expo-secure-store` | Renew ID + Access tokens |

Call `refreshAccessToken()` from `src/lib/auth.ts` before the Access Token expires.

## Redirect URI by Environment

| Environment | Redirect URI |
|-------------|-------------|
| iOS Simulator (Expo Go) | `exp://localhost:8081` |
| Android Emulator (Expo Go) | `exp://10.0.2.2:8081` |
| Physical device (Expo Go) | `exp://<your-machine-ip>:8081` |
| Standalone / EAS Build | `myapp://callback` |

`expo-auth-session`'s `makeRedirectUri()` resolves the correct URI at runtime automatically.

## CDK Stack Resources

| Resource | Purpose |
|----------|---------|
| `CognitoUserPool` | User directory |
| `CognitoUserPoolDomain` | Hosted UI domain |
| `UserPoolIdentityProviderGoogle` | Google federation |
| `UserPoolClient` | Public OAuth client (no secret, PKCE) |

## Security Notes

- No client secret — the App Client is a public client using PKCE only.
- Tokens are stored in the native keychain (iOS Keychain / Android Keystore) via `expo-secure-store`.
- The code verifier never leaves the device; only the code challenge is sent to Cognito.
- In production, restrict `callbackUrls` to only `myapp://callback`.
