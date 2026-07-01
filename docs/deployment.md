# Deployment Guide

## Cognito User Pool (AWS Console)

The User Pool is configured manually in the AWS Console. Once it exists, the
mobile app only needs the **App Client ID** and **domain prefix**.

> **Read this first:** a handful of settings are **fixed at creation time and
> cannot be edited afterward** — sign-in identifiers and required attributes
> are the two that bite most often. Get step 1 right the first time, or
> you'll end up recreating the pool.

### One-time setup

1. **Create a User Pool** — Cognito console → Create user pool:
   - **Cognito user pool sign-in options**: check **Email** only. Leave
     "Username" and "Phone number" unchecked unless you specifically want
     them — this cannot be changed later.
   - **Required attributes**: leave at the minimum you actually need
     (typically just `email`). Don't mark `phone_number` or
     `preferred_username` as required unless you want them on the sign-up
     form — this is also immutable after creation.
2. **Configure sign-up verification** — Authentication methods → Sign-up →
   Cognito-assisted verification and confirmation → Edit: check **Email**.
   Leave SMS unchecked unless you've deliberately set up SNS for it (new AWS
   accounts start in the SNS sandbox, which only delivers to pre-verified
   numbers — not worth it for dev/test). At least one delivery method must
   be checked, or sign-up fails with "User pool not configured properly for
   confirmation code delivery."
3. **Add a Cognito domain** — App integration → Domain → "Use a Cognito domain".
   Note the prefix, e.g. `us-east-1gdcgzpb1p`.
4. **Create a Managed Login branding style** — Branding → Managed login →
   create a style (defaults are fine for dev/test). New pools default to
   Managed Login, which requires a style to be assigned before the Hosted UI
   will render — otherwise the app client shows **Status: Unavailable** and
   users get "Login pages unavailable." You'll assign it to the app client
   in step 6.
5. **Add Google as an identity provider** — Sign-in experience → Federated
   identity provider sign-in → Google:
   - Client ID / secret from Google Cloud Console
   - Authorized scopes: `openid email profile`
   - Attribute mapping: `email → email`, `name → name`, `picture → picture`
6. **Create a public App Client** — App integration → App clients:
   - Type: **Public client** (no secret — uses PKCE)
   - Authentication flow: authorization code grant
   - OAuth scopes: `openid`, `email`, `profile`
   - Enabled identity providers: **Cognito user pool** and **Google**
   - Callback URLs: `myapp://callback`, `exp://localhost:8081/--/callback`,
     `exp://<your-ip>:8081/--/callback`
   - Sign-out URLs: `myapp://`, `exp://localhost:8081/--/callback`
   - Under **Managed login pages configuration**, assign the branding style
     from step 4.

   > Expo Go **owns the `exp://` scheme**, not your app's custom scheme —
   > `expo-auth-session`'s `makeRedirectUri()` falls back to `exp://` (with
   > an inserted `/--/` path segment) when running inside Expo Go, ignoring
   > whatever `scheme` you pass in. `myapp://callback` only applies to
   > standalone/dev-client builds. Check the app's console log (it logs the
   > resolved `redirectUri` before calling `promptAsync()`) to get the exact
   > value to register instead of guessing.
7. **Register the redirect URI in Google** — Google Cloud Console → your OAuth
   client → Authorized redirect URIs:
   ```
   https://<your-domain-prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```

### Troubleshooting

| Symptom                                                                   | Cause                                                                                                    | Fix                                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Google auth screen never appears, nothing visibly happens                | Google not enabled as an identity provider on the app client                                             | Step 5 — add Google at the pool level, then check it under the app client's Identity providers         |
| Save fails when adding a callback URL like `expo://localhost:8081`       | Wrong scheme — Expo Go uses `exp://`, not `expo://`, and needs the `/--/callback` path suffix             | Register the exact value logged by the app: `exp://localhost:8081/--/callback`                        |
| "An error was encountered with the requested page" on the Hosted UI      | `redirect_uri` not in Allowed callback URLs, or `client_id` is malformed (e.g. an Identity Pool ID)      | Verify callback URL list and that `EXPO_PUBLIC_USER_POOL_CLIENT_ID` is the App Client ID               |
| "Login pages unavailable"                                                | No Managed Login branding style assigned to the app client (Status: Unavailable)                         | Step 4 — create and assign a style                                                                     |
| Login page asks for "Username" even though pool is email-based           | Cosmetic — Hosted UI/Managed Login keeps the generic "Username" label regardless of sign-in identifier   | Enter the email anyway; it authenticates correctly                                                     |
| "Invalid input: incorrect username or password"                          | No user exists yet with that email                                                                       | Sign up via the Hosted UI's "Sign up" link, or create a user manually under **Users** in the console    |
| SMS verification code never arrives                                      | New AWS accounts start in the SNS SMS sandbox, which only delivers to pre-verified numbers                | Either verify the number in the SNS sandbox, or (simpler) disable SMS verification per step 2           |
| "User pool not configured properly for confirmation code delivery"       | No verification delivery method is enabled at all (e.g. SMS disabled and email never enabled)             | Step 2 — ensure at least Email is checked under Cognito-assisted verification and confirmation          |
| Need to remove `preferred_username`/`phone_number` from the sign-up form | These are required attributes set at pool creation and can't be edited afterward                          | Recreate the pool with only the required attributes you actually want (step 1)                          |

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
