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

App Store review requires these to be present and stable:

- `expo.ios.bundleIdentifier` — already `com.rafaelflorespereira.vshelper`
- `expo.version` — the user-facing version (e.g. `1.0.0`)
- `expo.icon` — 1024×1024 PNG, no alpha/transparency
- A splash screen (via `expo-splash-screen` or `expo.splash`)

> `ios.buildNumber` is managed automatically: `eas.json` uses
> `"appVersionSource": "remote"` with `"autoIncrement": true`, so EAS bumps the
> build number on each production build.

## 3. Configure secrets (env vars) for the build

Cloud builds do **not** read your local `.env`. Push each `EXPO_PUBLIC_*` value
as an EAS secret so it is inlined at build time:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_COGNITO_ISSUER --value https://cognito-idp.<region>.amazonaws.com/<pool-id>
eas secret:create --scope project --name EXPO_PUBLIC_USER_POOL_CLIENT_ID --value <client-id>
eas secret:create --scope project --name EXPO_PUBLIC_LOGOUT_URI --value vshelper://
eas secret:create --scope project --name EXPO_PUBLIC_APP_SCHEME --value vshelper
```

## 4. Point Cognito at the production scheme

The standalone app uses the custom scheme, **not** `exp://`. In the Cognito App
Client, ensure the callback / sign-out URLs include:

- Callback: `vshelper://callback`
- Sign-out: `vshelper://`

## 5. Fill in the submit credentials

Edit [`eas.json`](../apps/vs-helper/eas.json) → `submit.production.ios` and
replace the placeholders:

| Field         | Where to find it                                                        |
| ------------- | ----------------------------------------------------------------------- |
| `appleId`     | Your Apple ID email                                                     |
| `appleTeamId` | Apple Developer → Membership → Team ID                                  |
| `ascAppId`    | App Store Connect → your app → App Information → **Apple ID** (numeric) |

Create the app record first in **App Store Connect** (bundle ID must match
`com.rafaelflorespereira.vshelper`).

## 6. Build the production binary

```bash
eas build --platform ios --profile production
```

On first run EAS offers to **manage your signing credentials** (Distribution
certificate + provisioning profile) — accept and let EAS generate them. The
build runs in the cloud and produces a `.ipa`.

## 7. Submit to App Store Connect

```bash
eas submit --platform ios --profile production --latest
```

This uploads the build to App Store Connect. It then appears under **TestFlight**
(after Apple processing) and can be attached to an App Store version for review.

## 8. Submit for review

In **App Store Connect**:

1. Create a new version, attach the uploaded build.
2. Complete metadata, screenshots, privacy questionnaire, and export-compliance.
3. **Submit for Review**.

## Pre-submission checklist

- [ ] Apple Developer membership active
- [ ] App record created in App Store Connect (bundle ID matches)
- [ ] `expo.version` bumped for this release
- [ ] 1024×1024 icon (no transparency) and splash screen set
- [ ] EAS secrets set for all `EXPO_PUBLIC_*` vars
- [ ] Cognito callback/sign-out URLs include `vshelper://callback` and `vshelper://`
- [ ] `eas.json` submit credentials filled in
- [ ] Google OAuth consent screen **Published** (not Testing)
- [ ] Privacy policy URL ready (required by App Store)

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
| `EXPO_PUBLIC_*` undefined in the store build | Values must be set as **EAS secrets**; local `.env` is not used for cloud builds. |
| Icon rejected                                | Use a 1024×1024 PNG with **no alpha channel**.                                    |
| Missing compliance / privacy                 | Complete the export-compliance and App Privacy sections in App Store Connect.     |
