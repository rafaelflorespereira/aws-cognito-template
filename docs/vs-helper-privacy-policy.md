# Vibrational State — Privacy Policy

_Last updated: 2026-07-06_

This policy covers the **Vibrational State** app ("the app"). Host this page
somewhere public (e.g. GitHub Pages) and put its URL in App Store Connect's
App Privacy section — Apple requires a live privacy policy URL before review.

## What we collect

**If you don't sign in**, the app collects nothing beyond what stays on your
device: your practice schedule, daily progress, session history, and any
post-session reflections you save. None of it leaves your phone.

**If you sign in** (optional, via Google through Amazon Cognito), we also
process:

- Your **email address, name, and profile picture**, as provided by Google —
  used only to identify your account and show it in the app.
- Your **practice settings** (times per day, practice window, session length)
  and **session history** (dates/times you practiced), synced so they carry
  over across devices. This is keyed to an anonymous account identifier, not
  your name or email.

We do **not** collect your post-session reflections (chakras, wellbeing,
perceptions, notes) in the cloud — those stay on-device even when you're
signed in.

## What we don't do

- No advertising, no ad networks, no third-party analytics or trackers.
- No selling or sharing your data with third parties.
- No location, contacts, camera, or microphone access.

## Notifications

If you enable reminders, the app schedules local notifications on your
device. These are not sent from a server and no notification content is
transmitted anywhere.

## Data storage

- On-device data lives in your device's local app storage.
- Synced data (settings, session history, aggregate stats) is stored in
  AWS DynamoDB, partitioned per account, and accessible only to that account.

## Deleting your data

Uninstalling the app removes all on-device data. To remove synced data,
contact us at the email below and we'll delete your account's synced
settings, session history, and stats.

## Changes

We'll update this page if what the app collects changes, and update the
"last updated" date above.

## Contact

<!-- TODO: replace with a real support/contact email before publishing -->
support@example.com
