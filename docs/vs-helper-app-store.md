# Publishing the VS Helper to the App Store

End-to-end steps to build **`apps/vs-helper`** and ship it to the Apple App Store
using **EAS Build** and **EAS Submit**. For local dev-server testing (Expo Go),
see [`vs-helper-ios.md`](vs-helper-ios.md); for the Cognito setup, see
[`deployment.md`](deployment.md).

> You do **not** need a Mac to build — EAS builds in the cloud. You **do** need a
> paid **Apple Developer Program** membership ($99/yr) and an **Expo** account.

## Prerequisites

- **Apple Developer Program** membership (paid, approved)
- **Expo account** — create at [expo.dev](https://expo.dev)
- **EAS CLI**: `npm install -g eas-cli`
- App metadata ready in **App Store Connect** (name, description, screenshots,
  privacy details, age rating)

## 1. Log in and link the project

```bash
cd apps/vs-helper
eas login
eas init            # creates the EAS project and writes extra.eas.projectId to app.json
```

## 2. Verify required `app.json` fields

App Store review requires these to be present and stable — all already set:

- `expo.ios.bundleIdentifier` — `com.rafaelflorespereira.vshelper`
- `expo.ios.usesAppleSignIn` — `true`
- `expo.ios.entitlements.com.apple.developer.applesignin` — `["Default"]`
- `expo.plugins` includes `expo-apple-authentication`
- `expo.version` — the user-facing version (e.g. `1.0.0`)
- `expo.icon` — `./assets/icon.png` (1024×1024, no alpha/transparency)
- `expo.splash` — `./assets/splash.png`
- `expo.android.adaptiveIcon.foregroundImage` — `./assets/adaptive-icon.png`

> The `assets/` images are a **placeholder mark** (concentric rings in the
> app's indigo/navy palette), generated to unblock builds — swap them for
> real branding before a public release. Regenerate with
> `python3` + Pillow, or replace the PNGs directly; `app.json` doesn't need
> to change as long as the filenames stay the same.

> `ios.buildNumber` is managed automatically: `eas.json` uses
> `"appVersionSource": "remote"` with `"autoIncrement": true`, so EAS bumps the
> build number on each production build.

## 3. Configure environment variables for the build

Cloud builds do **not** read your local `.env`. Push each `EXPO_PUBLIC_*` value
as an EAS **environment variable** so it is inlined at build time. These values
are public (inlined into the JS bundle; the Cognito App Client is a public PKCE
client with no secret), so use `--visibility plaintext`.

The helper script `apps/vs-helper/eas-push-env.sh` reads `.env` and pushes every
`EXPO_PUBLIC_*` key to the `production`, `preview`, and `development` environments:

```bash
bash eas-push-env.sh
eas env:list production   # verify all vars are present
```

Or create them manually:

```bash
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_COGNITO_ISSUER --value https://cognito-idp.<region>.amazonaws.com/<pool-id>
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_USER_POOL_CLIENT_ID --value <client-id>
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_LOGOUT_URI --value vshelper://
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_APP_SCHEME --value vshelper
# Optional — cloud sync backend (infra/vs-helper-backend, see vs-helper-backend.md).
# Omit this var and the app runs fully on-device; sync silently no-ops without it.
eas env:create --scope project --visibility plaintext \
  --environment production --environment preview --environment development \
  --name EXPO_PUBLIC_API_BASE_URL --value https://<api-id>.execute-api.<region>.amazonaws.com
```

> `eas secret:*` is deprecated — use `eas env:*`. Each build profile in
> [`eas.json`](../apps/vs-helper/eas.json) sets `"environment"` so the build
> pulls the matching set of variables.

## 4. Point Cognito at the production scheme

The standalone app uses the custom scheme, **not** `exp://`. In the Cognito App
Client, ensure the callback / sign-out URLs include:

- Callback: `vshelper://callback`
- Sign-out: `vshelper://`

## 5. Configure Sign in with Apple

On iOS, the Account screen presents Apple's native **Sign in with Apple** button
and **Sign in with Google** with equal prominence. Both use Cognito's
Authorization Code + PKCE flow. The Apple button sends
`identity_provider=SignInWithApple`, and both requests use `prompt=login` so a
previous Cognito browser session cannot select the wrong provider.

Complete the Apple Developer and Cognito configuration in
[`deployment.md`](deployment.md#10-enable-sign-in-with-apple-for-the-app-id):

1. Enable Sign in with Apple on the app's primary App ID.
2. Create an Apple Services ID with the Cognito domain and
   `/oauth2/idpresponse` return URL.
3. Create a Sign in with Apple private key.
4. Add the provider to Cognito and enable **Sign in with Apple** on the same App
   Client used by the production build.
5. Test a new Apple authorization and select **Hide My Email**.

Do not submit a build with the Apple button visible until this provider is live;
otherwise the reviewer will reach a Cognito error page.

## 6. Fill in the submit credentials

Edit [`eas.json`](../apps/vs-helper/eas.json) → `submit.production.ios` and
replace the placeholders:

| Field         | Where to find it                                                        |
| ------------- | ----------------------------------------------------------------------- |
| `appleId`     | Your Apple ID email                                                     |
| `appleTeamId` | Apple Developer → Membership → Team ID                                  |
| `ascAppId`    | App Store Connect → your app → App Information → **Apple ID** (numeric) |

Create the app record first in **App Store Connect** (bundle ID must match
`com.rafaelflorespereira.vshelper`).

## 7. Build the production binary

```bash
eas build --platform ios --profile production
```

On first run EAS offers to **manage your signing credentials** (Distribution
certificate + provisioning profile) — accept and let EAS generate them. The
build runs in the cloud and produces a `.ipa`.

## 8. Submit to App Store Connect

```bash
eas submit --platform ios --profile production --latest
```

This uploads the build to App Store Connect. It then appears under **TestFlight**
(after Apple processing) and can be attached to an App Store version for review.

## 9. Submit for review

In **App Store Connect**:

1. Create a new version, attach the uploaded build.
2. Complete metadata, screenshots, privacy questionnaire, and export-compliance.
3. **Submit for Review**.

## 10. Respond to Guideline 4.8

Use this in the App Review Resolution Center after the new build is attached:

> We added Sign in with Apple as an equivalent login option on the Account
> screen, alongside Sign in with Google with equal prominence. Sign in with
> Apple requests only the user's name and email address, supports Hide My Email,
> and authenticates through our Amazon Cognito public PKCE client. The app has no
> advertising, ad networks, third-party analytics, or cross-app tracking, and
> login remains optional because the core app works without an account.

## Pre-submission checklist

Items marked **done** are already handled in this repo; the rest need one of
your own accounts (Apple, Expo/EAS, App Store Connect) and can't be automated.

- [x] 1024×1024 icon (no transparency), splash, and Android adaptive icon set
      (`apps/vs-helper/assets/` — placeholder branding, swap before a public release)
- [x] Apple's native sign-in button and Google shown with equal prominence on iOS
- [x] Sign in with Apple entitlement configured explicitly
- [x] Privacy policy drafted — [`vs-helper-privacy-policy.md`](vs-helper-privacy-policy.md)
- [ ] Privacy policy **published** at a public URL (e.g. GitHub Pages) and the
      contact email in it replaced with a real one
- [ ] Apple Developer membership active
- [ ] App record created in App Store Connect (bundle ID matches)
- [ ] `expo.version` bumped for this release
- [ ] EAS environment variables set for all `EXPO_PUBLIC_*` vars (§3 above)
- [ ] Cognito callback/sign-out URLs include `vshelper://callback` and `vshelper://`
- [ ] Apple App ID, Services ID, and private key configured
- [ ] Cognito App Client enables **Sign in with Apple** and **Google**
- [ ] Sign in with Apple tested with **Hide My Email** in the production build
- [ ] `eas.json` submit credentials filled in (`appleId`, `appleTeamId`, `ascAppId`)
- [ ] Google OAuth consent screen **Published** (not Testing)
- [ ] Privacy policy URL entered in App Store Connect's App Privacy section

## Subsequent releases

```bash
# bump expo.version in app.json for a user-facing release, then:
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

The build number auto-increments; only bump `expo.version` when the marketing
version changes.

## Troubleshooting

| Symptom                                      | Fix                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `Invalid bundle identifier`                  | Bundle ID in `app.json` must match the App Store Connect app record exactly.      |
| Build succeeds but login fails in prod       | Add `vshelper://callback` / `vshelper://` to the Cognito App Client URLs.         |
| `EXPO_PUBLIC_*` undefined in the store build | Values must be set as **EAS environment variables** in the `production` environment (`eas env:list production`); local `.env` is not used for cloud builds. |
| Apple button opens a Cognito error            | Finish the Apple Services ID/private-key setup and enable `SignInWithApple` on the Cognito App Client. |
| Apple shows `invalid_client`                  | Verify Services ID, Team ID, Key ID, private key, Cognito domain, and `/oauth2/idpresponse` return URL. |
| Icon rejected                                | Use a 1024×1024 PNG with **no alpha channel**.                                    |
| Missing compliance / privacy                 | Complete the export-compliance and App Privacy sections; publish [`vs-helper-privacy-policy.md`](vs-helper-privacy-policy.md) and link it. |
