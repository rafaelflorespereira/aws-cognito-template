# Setup & Deployment Guide

End-to-end steps to create the Cognito User Pool, wire up Sign in with Apple and
Google SSO, and ship the Expo app. Follow them in order.

> Sign-in identifiers and required attributes are **fixed at pool creation** —
> get step 1 right or recreate the pool.

## 1. Create the Cognito User Pool

Cognito console → **Set up resources for your application**:

- **Application type**: Mobile app
- **Name**: e.g. `aws-cognito-mobile`
- **Sign-in identifiers**: Email only
- **Social/SAML/OIDC sign-in**: click the link, choose **Google** and
  **Sign in with Apple**
- **Self-registration**: disabled
- **Required attributes**: `email` (and optionally `name`)
- **Return URL**: `vshelper://callback`

## 2. Configure sign-up verification

Authentication methods → Sign-up → Cognito-assisted verification → Edit → check
**Email** (at least one delivery method is required). Leave SMS off.

## 3. Add a Cognito domain

App integration → Domain → **Use a Cognito domain**. Note the prefix
(e.g. `us-east-1gdcgzpb1p`).

## 4. Create a Managed Login branding style

Branding → Managed login → create a style (defaults are fine). Required or the
Hosted UI shows "Login pages unavailable".

## 5. Create a Google Cloud project

[Google Cloud Console](https://console.cloud.google.com/) → **Select a project**
→ **New Project** → name it → **Create**.

## 6. Enable the Google People API

APIs & Services → Library → search **Google People API** → **Enable**.

## 7. Configure the OAuth consent screen

APIs & Services → OAuth consent screen:

- User type: **External**
- App name, user support email, developer contact email
- Scopes: `openid`, `email`, `profile`

> In Testing mode only listed test users can sign in. Publish for production.

## 8. Create Google OAuth credentials

APIs & Services → Credentials → **Create Credentials → OAuth 2.0 Client IDs**:

- Application type: **Web application**
- **Authorized JavaScript origins**: leave empty
- **Authorized redirect URIs** → **Add URI** → paste your Cognito
  `/oauth2/idpresponse` endpoint (this is required — skipping it causes
  `redirect_uri_mismatch`):

  ```
  https://<domain-prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse
  ```

  Use the domain from step 3, all lowercase. Example:

  ```
  https://us-east-1abcd1234xy.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
  ```

- **Create**, then copy the **Client ID** and **Client Secret**.

> This URI must match Cognito's domain **exactly** (scheme, host, `/oauth2/idpresponse`,
> no trailing slash). Changes can take a few minutes to propagate on Google's side.

## 9. Add Google to Cognito

Sign-in experience → Federated identity provider sign-in → **Google**:

- App client ID / secret: the Google Client ID / Secret from step 8
- Authorized scopes: `openid email profile`
- Attribute mapping: `email → email`, `name → name`, `picture → picture`

## 10. Enable Sign in with Apple for the app ID

In [Apple Developer](https://developer.apple.com/account/resources/identifiers/list):

1. Open the App ID for `com.rafaelflorespereira.vshelper`.
2. Enable the **Sign in with Apple** capability.
3. Keep this App ID as the primary App ID when Apple asks which app owns the
   sign-in configuration.

The app installs the `expo-apple-authentication` config plugin, sets
`expo.ios.usesAppleSignIn: true`, and declares the Apple sign-in entitlement.
The Apple Developer capability must be enabled before the next EAS build is
signed.

## 11. Create an Apple Services ID

Apple Developer → **Certificates, Identifiers & Profiles → Identifiers**:

1. Create a **Services ID** (for example,
   `com.rafaelflorespereira.vshelper.signin`).
2. Enable **Sign in with Apple**, choose the app's primary App ID, then configure
   web authentication.
3. Add the Cognito domain host under **Domains and Subdomains**:

   ```
   <domain-prefix>.auth.<region>.amazoncognito.com
   ```

4. Add this exact **Return URL**:

   ```
   https://<domain-prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```

The Services ID, not the iOS bundle identifier, is the Apple `client_id` that
you enter in Cognito.

## 12. Create a Sign in with Apple private key

Apple Developer → **Keys → Create a key**:

1. Enable **Sign in with Apple** and associate the app's primary App ID.
2. Register the key and download the `.p8` file.
3. Record the **Key ID** and your Apple Developer **Team ID**.

Apple lets you download the private key only once. Store it as a secret and
never commit it to this repository.

## 13. Add Sign in with Apple to Cognito

Cognito → Sign-in experience → Federated identity provider sign-in →
**Sign in with Apple**:

- Services ID: the identifier from step 11
- Team ID: Apple Developer → Membership
- Key ID and private key: from step 12
- Authorized scopes: `email name`
- Attribute mapping: `email → email`, `name → name`

Keep `name` optional in the Cognito user pool. Apple supplies the user's name
only on the first authorization, while the email claim remains available and
can be an Apple private relay address when the user selects **Hide My Email**.

## 14. Create a public App Client

App integration → App clients:

- Type: **Public client** (no secret — uses PKCE)
- Auth flow: authorization code grant
- OAuth scopes: `openid`, `email`, `profile`
- Enabled identity providers: **Cognito user pool**, **Google**, and
  **Sign in with Apple**
- Callback URLs: `vshelper://callback`, `exp://localhost:8081/--/callback`,
  `exp://<your-ip>:8081/--/callback`
- Sign-out URLs: `vshelper://`, `exp://localhost:8081/--/callback`
- Managed login pages configuration: assign the branding style from step 4

> Inside Expo Go the redirect is `exp://…/--/callback`, not `vshelper://callback`.
> The app logs the resolved `redirectUri` before `promptAsync()` — register that
> exact value. The app sends `identity_provider=Google` or
> `identity_provider=SignInWithApple` so each button opens the matching provider
> directly, and `prompt=login` prevents a previous Cognito browser session from
> silently selecting the wrong provider.

## 15. Configure the mobile app

Copy these from the pool's **"Add the example code to your application"** page
(OIDC properties) into `apps/vs-helper/.env`:

| Console value (OIDC properties) | `.env` variable                   |
| ------------------------------- | --------------------------------- |
| `issuer`                        | `EXPO_PUBLIC_COGNITO_ISSUER`      |
| `clientID`                      | `EXPO_PUBLIC_USER_POOL_CLIENT_ID` |
| `logoutURL` (optional)          | `EXPO_PUBLIC_LOGOUT_URI`          |

```bash
cd apps/vs-helper
cp .env.example .env
# fill in the issuer and App Client ID
npm install
```

The app discovers the hosted-UI endpoints from the issuer, so no domain prefix
or region is set separately.

## 16. Run locally

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

On a physical device, add your machine's IP callback
(`exp://<your-ip>:8081/--/callback`) to the App Client first.

## 17. Production build (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

Set EAS environment variables (`eas secret:*` is deprecated — use `eas env:*`):

```bash
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_COGNITO_ISSUER --value https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_USER_POOL_CLIENT_ID --value <value>
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_LOGOUT_URI --value vshelper://
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_APP_SCHEME --value vshelper
```

## Production checklist

- [ ] Google OAuth consent screen is **Published**
- [ ] Apple App ID has **Sign in with Apple** enabled
- [ ] Apple Services ID domain and return URL exactly match the Cognito domain
- [ ] Apple private key is active and configured in Cognito
- [ ] App Client enables both **Google** and **Sign in with Apple**
- [ ] Sign in with Apple tested once with **Hide My Email**
- [ ] App Client `callbackUrls` contains only `vshelper://callback`
- [ ] App Client `logoutUrls` contains only `vshelper://`
- [ ] `app.json` → `ios.bundleIdentifier` and `android.package` set
- [ ] EAS secrets configured (no committed `.env`)
- [ ] Token refresh tested
- [ ] Refresh token rotation enabled in the App Client

## Troubleshooting

| Symptom                                                            | Fix                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `redirect_uri_mismatch` in Google                                  | Google redirect URI must exactly match the Cognito `/oauth2/idpresponse` URL         |
| Google auth screen never appears                                   | Enable Google as an identity provider on the App Client (step 14)                    |
| Apple shows `invalid_client`                                       | Recheck the Services ID, Team ID, Key ID, private key, and Apple return URL           |
| Apple button opens a Cognito error                                 | Enable `SignInWithApple` on the App Client and confirm the provider is active         |
| Save fails for callback like `expo://localhost:8081`               | Use `exp://localhost:8081/--/callback` — Expo Go uses `exp://` with `/--/`           |
| "An error was encountered with the requested page"                 | `redirect_uri` not in callback URLs, or wrong `EXPO_PUBLIC_USER_POOL_CLIENT_ID`      |
| "Login pages unavailable"                                          | Assign a Managed Login branding style (step 4)                                       |
| "App is not verified"                                              | Add the user as a Google test user, or publish the Google consent screen              |
| "Invalid input: incorrect username or password"                    | No user exists yet — sign up via Hosted UI or create one under **Users**              |
| SMS code never arrives                                             | New accounts are in the SNS SMS sandbox — use email verification (step 2)            |
| "User pool not configured properly for confirmation code delivery" | Enable at least Email verification (step 2)                                          |
| Attributes not mapped                                              | Check the attribute mappings on both federated identity providers                    |

## Useful AWS CLI commands

```bash
aws cognito-idp describe-user-pool-client --user-pool-id <POOL_ID> --client-id <CLIENT_ID>
aws cognito-idp list-users --user-pool-id <POOL_ID>
aws cognito-idp update-user-pool-client \
  --user-pool-id <POOL_ID> --client-id <CLIENT_ID> \
  --callback-urls '["vshelper://callback"]' --logout-urls '["vshelper://"]'
```
