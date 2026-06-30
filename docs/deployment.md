# Deployment Guide

## Cognito User Pool (AWS Console)

The User Pool is configured manually in the AWS Console. Once it exists, the
mobile app only needs the **App Client ID** and **domain prefix**.

### One-time setup

1. **Create a User Pool** — Cognito console → Create user pool → email sign-in.
2. **Add a Cognito domain** — App integration → Domain → "Use a Cognito domain".
   Note the prefix, e.g. `us-east-1gdcgzpb1p`.
3. **Add Google as an identity provider** — Sign-in experience → Federated
   identity provider sign-in → Google:
   - Client ID / secret from Google Cloud Console
   - Authorized scopes: `openid email profile`
   - Attribute mapping: `email → email`, `name → name`, `picture → picture`
4. **Create a public App Client** — App integration → App clients:
   - Type: **Public client** (no secret — uses PKCE)
   - Authentication flow: authorization code grant
   - OAuth scopes: `openid`, `email`, `profile`
   - Enabled identity providers: **Google**
   - Callback URLs: `myapp://callback`, `exp://localhost:8081`, `exp://<your-ip>:8081`
   - Sign-out URLs: `myapp://`, `exp://localhost:8081`
5. **Register the redirect URI in Google** — Google Cloud Console → your OAuth
   client → Authorized redirect URIs:
   ```
   https://<your-domain-prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```

### Values to copy into `mobile/.env`

| Console location                    | `.env` variable                   |
| ----------------------------------- | --------------------------------- |
| App client ID (App integration tab) | `EXPO_PUBLIC_USER_POOL_CLIENT_ID` |
| Domain prefix (Domain section)      | `EXPO_PUBLIC_COGNITO_DOMAIN`      |
| Pool region                         | `EXPO_PUBLIC_AWS_REGION`          |

---

## Mobile App (Expo)

### Local development

```bash
cd mobile
cp .env.example .env
# fill in the App Client ID and domain prefix from the console
npm install
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### Expo Go on a physical device

`expo-auth-session` generates a redirect URI like `exp://192.168.x.x:8081`.
Add your machine's local IP to the App Client's **callback URLs** in the Cognito
console before testing on a real device.

### Production build (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure

# Build for both platforms
eas build --platform all
```

EAS Build uses the `myapp://callback` scheme (standalone app), which must be
registered in the Cognito App Client's callback URLs.

Set environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_AWS_REGION --value us-east-1
eas secret:create --scope project --name EXPO_PUBLIC_USER_POOL_CLIENT_ID --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_COGNITO_DOMAIN --value <domain-prefix>
eas secret:create --scope project --name EXPO_PUBLIC_APP_SCHEME --value myapp
```

> These values are public (inlined into the bundle). Using EAS secrets keeps them
> out of the repo, but they are not confidential — the real secrets (Google client
> secret) live only in Cognito.

---

## Production Checklist

- [ ] Google OAuth consent screen is **Published** (not Testing)
- [ ] App Client `callbackUrls` contains only `myapp://callback` (remove `exp://` URLs)
- [ ] App Client `logoutUrls` contains only `myapp://`
- [ ] `app.json` → `ios.bundleIdentifier` and `android.package` are set to your real identifiers
- [ ] EAS secrets are configured (not a committed `.env` file)
- [ ] Token refresh logic is tested (let access token expire and verify silent refresh works)
- [ ] Refresh token rotation enabled in the Cognito App Client

---

## Useful AWS CLI Commands

```bash
# Describe the app client
aws cognito-idp describe-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID>

# List federated users
aws cognito-idp list-users --user-pool-id <POOL_ID>

# Update callback URLs after changing scheme
aws cognito-idp update-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID> \
  --callback-urls '["myapp://callback"]' \
  --logout-urls '["myapp://"]'
```
