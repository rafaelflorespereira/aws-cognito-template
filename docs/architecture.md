# Architecture

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Next.js 14 App (frontend/)                 │   │
│  │                                                          │   │
│  │  /                → Home / Dashboard (protected)         │   │
│  │  /auth/callback   → OAuth callback handler               │   │
│  │                                                          │   │
│  │  AWS Amplify v6 Auth library                             │   │
│  │   - signInWithRedirect()                                 │   │
│  │   - getCurrentUser() / fetchAuthSession()                │   │
│  │   - signOut()                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      AWS Cloud                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Cognito User Pool                             │   │
│  │                                                          │   │
│  │  App Client (public, no secret)                          │   │
│  │   - Auth flows: ALLOW_USER_SRP_AUTH                      │   │
│  │   - OAuth: authorization_code + PKCE                     │   │
│  │   - Scopes: openid, email, profile                       │   │
│  │                                                          │   │
│  │  Identity Provider: Google                               │   │
│  │   - Client ID + Secret from Google Cloud Console         │   │
│  │   - Attribute mappings: email, name, picture             │   │
│  │                                                          │   │
│  │  Hosted UI Domain                                        │   │
│  │   - <prefix>.auth.<region>.amazoncognito.com             │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │ Federation                         │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  (External) Google OAuth 2.0                             │   │
│  │   accounts.google.com/o/oauth2/auth                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

## OAuth Authorization Code Flow (PKCE)

```
App           Cognito Hosted UI       Google OAuth
 │                   │                     │
 │──signInWithRedirect──▶                  │
 │                   │                     │
 │                   │──redirect to Google─▶│
 │                   │                     │
 │                   │◀──auth code─────────│
 │                   │                     │
 │                   │──token exchange──────│ (server-side)
 │                   │                     │
 │◀──redirect to /auth/callback            │
 │   ?code=...                             │
 │                   │                     │
 │──exchange code────▶                     │
 │                   │                     │
 │◀──ID + Access + Refresh tokens──────────│
 │                   │                     │
 │ store in memory / cookie                │
```

## Token Lifecycle

| Token | TTL | Storage | Usage |
|-------|-----|---------|-------|
| ID Token (JWT) | 1 hour | Amplify in-memory | User identity claims |
| Access Token (JWT) | 1 hour | Amplify in-memory | API authorization |
| Refresh Token | 30 days | HTTP-only cookie | Renew ID + Access tokens |

Amplify v6 auto-refreshes ID/Access tokens using the Refresh token before expiry.

## CDK Stack Resources

| Resource | Type | Purpose |
|----------|------|---------|
| `CognitoUserPool` | `aws_cognito.UserPool` | User directory |
| `CognitoUserPoolDomain` | `aws_cognito.UserPoolDomain` | Hosted UI domain |
| `GoogleIdP` | `aws_cognito.UserPoolIdentityProviderGoogle` | Google federation |
| `AppClient` | `aws_cognito.UserPoolClient` | Frontend OAuth client |

## Security Notes

- The app client has **no client secret** (public client, PKCE only).
- Allowed callback URLs are restricted to known origins.
- Refresh tokens are stored via Amplify's secure cookie storage when configured.
- In production, set `allowedOrigins` to your exact domain (no wildcards).
