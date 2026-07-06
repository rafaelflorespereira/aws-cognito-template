import { getStoredTokens, refreshAccessToken } from "@vs/auth";
import type { LifetimeStats, SessionRecord, VSSettings } from "@vs/shared";
import { loadSettings, loadSettingsUpdatedAt, saveSettings } from "./storage";

// Thin client for infra/vs-helper-backend (docs/vs-helper-backend.md). Sync is
// entirely best-effort: signed-out, unconfigured, or offline all degrade to a
// silent no-op so the on-device app keeps working exactly as it did before.

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export function isSyncConfigured(): boolean {
  return BASE_URL.length > 0;
}

interface SyncedSettings extends VSSettings {
  updatedAt: string;
}

async function authedRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  if (!isSyncConfigured()) return null;

  const tokens = await getStoredTokens();
  if (!tokens) return null; // signed out — sync is opt-in

  const attempt = (idToken: string) =>
    fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

  try {
    let res = await attempt(tokens.idToken);
    if (res.status === 401 && tokens.refreshToken) {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      if (refreshed) res = await attempt(refreshed.idToken);
    }
    return res;
  } catch (err) {
    console.warn(`[vs/sync] ${path} failed:`, err);
    return null;
  }
}

async function pullSettings(): Promise<SyncedSettings | null> {
  const res = await authedRequest("/settings");
  if (!res || !res.ok) return null;
  return res.json();
}

export async function pushSettings(
  settings: VSSettings,
  updatedAt: string,
): Promise<void> {
  await authedRequest("/settings", {
    method: "PUT",
    body: JSON.stringify({ ...settings, updatedAt }),
  });
}

export async function pushSession(
  record: SessionRecord,
  goalPerDay: number,
): Promise<LifetimeStats | null> {
  const res = await authedRequest("/sessions", {
    method: "POST",
    body: JSON.stringify({ ...record, goalPerDay }),
  });
  if (!res || !res.ok) return null;
  const body = await res.json();
  return body.stats ?? null;
}

/**
 * Reconciles local settings with the server: applies the remote copy if it's
 * newer (last-write-wins by `updatedAt`), otherwise pushes the local copy up.
 * Call after sign-in and once on app launch. Returns the settings that should
 * now be reflected in UI state, or null if nothing changed locally.
 */
export async function syncSettingsNow(): Promise<VSSettings | null> {
  try {
    const [remote, local, localUpdatedAt] = await Promise.all([
      pullSettings(),
      loadSettings(),
      loadSettingsUpdatedAt(),
    ]);

    if (remote && (!localUpdatedAt || remote.updatedAt > localUpdatedAt)) {
      const { updatedAt, ...remoteSettings } = remote;
      await saveSettings(remoteSettings, updatedAt);
      return remoteSettings;
    }

    const updatedAt = localUpdatedAt || (await saveSettings(local));
    await pushSettings(local, updatedAt);
    return null;
  } catch (err) {
    console.warn("[vs/sync] settings reconcile failed:", err);
    return null;
  }
}
