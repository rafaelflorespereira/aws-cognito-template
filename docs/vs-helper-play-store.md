# Publishing the VS Helper to Google Play

End-to-end steps to build **`apps/vs-helper`** and ship it to the Google Play
Store using **EAS Build** and **EAS Submit**. For local dev-server testing, see
[`vs-helper-ios.md`](vs-helper-ios.md) (same steps apply to Android via
`npm run android`); for the Cognito setup, see [`deployment.md`](deployment.md);
for the iOS/App Store equivalent, see [`vs-helper-app-store.md`](vs-helper-app-store.md).

> You do **not** need Android Studio to build — EAS builds in the cloud. You
> **do** need a **Google Play Developer** account ($25 one-time fee) and an
> **Expo** account.

## Prerequisites

- **Google Play Developer** account (one-time $25 fee, approved)
- **Expo account** — create at [expo.dev](https://expo.dev)
- **EAS CLI**: `npm install -g eas-cli`
- App metadata ready for the Play Console store listing (description,
  screenshots, feature graphic, content rating, Data safety form)

## 1. Log in and link the project

```bash
cd apps/vs-helper
eas login
eas init            # no-op if already linked from the iOS setup
```

## 2. Verify required `app.json` fields

Already set:

- `expo.android.package` — `com.rafaelflorespereira.vshelper`
- `expo.version` — the user-facing version (e.g. `1.0.0`)
- `expo.android.adaptiveIcon.foregroundImage` — `./assets/adaptive-icon.png`
- `expo.android.adaptiveIcon.backgroundColor` — `#0f172a`

> The adaptive icon is a **placeholder mark** (concentric rings), generated to
> unblock builds — swap it for real branding before a public release.

> Android version codes are managed the same way as iOS build numbers: `eas.json`
> uses `"appVersionSource": "remote"` with `"autoIncrement": true`, so EAS bumps
> `versionCode` on each production build.

## 3. Configure secrets (env vars) for the build

If you already set these up for the iOS build (same EAS project), skip this —
secrets are shared across platforms in one EAS project:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_COGNITO_ISSUER --value https://cognito-idp.<region>.amazonaws.com/<pool-id>
eas secret:create --scope project --name EXPO_PUBLIC_USER_POOL_CLIENT_ID --value <client-id>
eas secret:create --scope project --name EXPO_PUBLIC_LOGOUT_URI --value vshelper://
eas secret:create --scope project --name EXPO_PUBLIC_APP_SCHEME --value vshelper
# Optional — cloud sync backend (infra/vs-helper-backend, see vs-helper-backend.md).
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value https://<api-id>.execute-api.<region>.amazonaws.com
```

## 4. Point Cognito at the production scheme

Same `vshelper://` scheme is used on both platforms. In the Cognito App
Client, ensure the callback / sign-out URLs include:

- Callback: `vshelper://callback`
- Sign-out: `vshelper://`

If you've already done this for the iOS release, no changes are needed —
Android uses the same custom-scheme redirect.

## 5. Create the app in Google Play Console

1. Play Console → **Create app** → name it, package name
   `com.rafaelflorespereira.vshelper`.
2. Fill in the **Store listing** (description, screenshots, feature graphic).
3. Complete the **Content rating** questionnaire.
4. Complete the **Data safety** form (what data is collected — see
   [`vs-helper-privacy-policy.md`](vs-helper-privacy-policy.md) for what the
   app actually does).
5. Enter the **Privacy policy URL** (must be published at a public URL — same
   open item as the iOS checklist).

## 6. Create a service account for automated submission

`eas submit` needs a Google service account with API access to Play Console:

1. [Google Cloud Console](https://console.cloud.google.com/) → select (or
   create) a project → **IAM & Admin → Service Accounts → Create service account**.
2. Grant it no project-level role (permissions are granted in Play Console
   instead) → **Create key** → JSON → download it.
3. In Play Console → **Setup → API access** → link the Google Cloud project →
   grant the service account **Release** permissions (at least
   "Release to testing tracks", plus "Release to production" once you're
   ready).
4. Save the downloaded JSON key as `apps/vs-helper/google-service-account.json`
   — **do not commit it** (add to `.gitignore` if not already ignored).

## 7. Fill in the submit credentials

Edit [`eas.json`](../apps/vs-helper/eas.json) → `submit.production.android` →
`serviceAccountKeyPath` already points at
`./google-service-account.json`; adjust the path if you saved the key
elsewhere.

## 8. Build the production binary

```bash
eas build --platform android --profile production
```

On first run EAS offers to **manage your signing credentials** (upload key /
keystore) — accept and let EAS generate them. The build runs in the cloud and
produces a `.aab` (Android App Bundle).

## 9. First release: upload manually

Google requires a new app's **first** release to be uploaded through the Play
Console UI (Testing → Internal testing, or Production) — API-based submission
via `eas submit` only works for apps that already have at least one release.

1. Download the `.aab` from the EAS build page (or run
   `eas build --platform android --profile production` and grab the artifact URL).
2. Play Console → your app → **Testing → Internal testing** (or **Production**)
   → **Create new release** → upload the `.aab` → fill in release notes → roll out.

## 10. Subsequent releases via EAS Submit

Once the app has at least one manual release, later builds can be pushed with:

```bash
eas submit --platform android --profile production --latest
```

This uploads directly to the track configured in `eas.json`
(`submit.production.android.track`, default `internal`). Promote through
**Internal testing → Closed testing → Production** in Play Console, increasing
the rollout percentage as you go.

## Pre-submission checklist

Items marked **done** are already handled in this repo; the rest need one of
your own accounts (Google Play, Expo/EAS, Google Cloud) and can't be automated.

- [x] Android adaptive icon set (`apps/vs-helper/assets/` — placeholder
      branding, swap before a public release)
- [x] Privacy policy drafted — [`vs-helper-privacy-policy.md`](vs-helper-privacy-policy.md)
- [ ] Privacy policy **published** at a public URL and the contact email in it
      replaced with a real one
- [ ] Google Play Developer account active ($25 one-time fee paid)
- [ ] App created in Play Console (package name matches)
- [ ] Store listing, content rating, and Data safety form completed
- [ ] `expo.version` bumped for this release
- [ ] EAS secrets set for all `EXPO_PUBLIC_*` vars (§3 above; shared with iOS
      if using the same EAS project)
- [ ] Cognito callback/sign-out URLs include `vshelper://callback` and `vshelper://`
- [ ] Google Cloud service account created, granted Play Console **Release**
      permissions, and its JSON key saved to `apps/vs-helper/google-service-account.json`
- [ ] First release uploaded manually in Play Console (§9)
- [ ] Google OAuth consent screen **Published** (not Testing)
- [ ] Privacy policy URL entered in Play Console's Data safety section

## Subsequent releases

```bash
# bump expo.version in app.json for a user-facing release, then:
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```

`versionCode` auto-increments; only bump `expo.version` when the marketing
version changes.

## Troubleshooting

| Symptom                                            | Fix                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `eas submit` fails with a permissions error         | Service account needs "Release" permission on the app in Play Console §6.        |
| `eas submit` fails on a brand-new app               | First release must be uploaded manually through the Play Console UI (§9).        |
| Build succeeds but login fails in prod              | Add `vshelper://callback` / `vshelper://` to the Cognito App Client URLs.         |
| `EXPO_PUBLIC_*` undefined in the store build        | Values must be set as **EAS secrets**; local `.env` is not used for cloud builds. |
| App rejected for missing Data safety info           | Complete the Data safety form; publish and link [`vs-helper-privacy-policy.md`](vs-helper-privacy-policy.md). |
| "Package name already exists"                       | Package name must be globally unique on Play and match `app.json`'s `android.package` exactly. |
