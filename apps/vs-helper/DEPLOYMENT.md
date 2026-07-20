# Deploying vs-helper to Google Play Store

## Current state

- `app.json`: Android package `com.rafaelflorespereira.vshelper` ✓
- `eas.json`: `submit.production.android` points to `./google-service-account.json` with track `internal` ✓
- `google-service-account.json` is already covered by the root `.gitignore` — safe to drop the key file into `apps/vs-helper/` once you have it.
- The service account key file itself does not exist yet — this is the main blocker.

## Steps to ship

1. **Create a Google Play Console app listing** (if not already done)
   - $25 one-time registration
   - Create the app for package `com.rafaelflorespereira.vshelper`

2. **Get the Play API service account JSON**
   - In Play Console: **Setup → API access** → link/create a Google Cloud project → create a **Service Account** with **Release Manager** access → generate a JSON key
   - Save it as `apps/vs-helper/google-service-account.json` (already gitignored)

3. **First release must be manual** — Google requires the very first AAB upload to go through the Play Console UI; `eas submit` can't do it cold.
   ```
   cd apps/vs-helper
   eas build --platform android --profile production
   ```
   Download the resulting `.aab` and upload it manually to a track (Internal testing is easiest) in Play Console, along with:
   - Store listing
   - Content rating questionnaire
   - Data safety form
   - Privacy policy URL

4. **After the first manual upload**, subsequent releases can go through EAS directly:
   ```
   eas build --platform android --profile production
   eas submit --platform android
   ```
   This uses the `google-service-account.json` + `track: "internal"` already configured in `eas.json`.

5. Once verified on internal testing, promote the release to **Production** from within Play Console (or bump `track` to `"production"` in `eas.json` for future submits).
