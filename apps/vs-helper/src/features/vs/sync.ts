import { useEffect, useState } from "react";
import { getStoredTokens, refreshAccessToken } from "@vs/auth";
import type {
  Group,
  LeaderboardEntry,
  LifetimeStats,
  SessionRecord,
  UserProfile,
  VSSettings,
} from "@vs/shared";
import {
  buildTodayProgressFromHistory,
  loadHistory,
  loadSettings,
  loadSettingsUpdatedAt,
  saveHistory,
  saveSettings,
  saveTodayProgress,
} from "./storage";

// Thin client for infra/vs-helper-backend (docs/vs-helper-backend.md). Sync is
// entirely best-effort: signed-out, unconfigured, or offline all degrade to a
// silent no-op so the on-device app keeps working exactly as it did before.

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export type SyncErrorCode =
  | "unconfigured"
  | "signed_out"
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "bad_request"
  | "server"
  | "invalid_response";

export interface SyncError {
  code: SyncErrorCode;
  method: string;
  path: string;
  message: string;
  status?: number;
  details?: string;
}

export type SyncResult<T> =
  | { data: T; error: null }
  | { data: null; error: SyncError };

export function isSyncConfigured(): boolean {
  return BASE_URL.length > 0;
}

interface SyncedSettings extends VSSettings {
  updatedAt: string;
}

function mapStatusToCode(status: number): SyncErrorCode {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status >= 500) return "server";
  return "bad_request";
}

function logSyncError(error: SyncError): void {
  const status = error.status ? ` ${error.status}` : "";
  const details = error.details ? ` ${error.details}` : "";
  console.error(
    `[vs/sync] ${error.method} ${error.path} -> ${error.code}${status}: ${error.message}${details}`,
  );
}

async function parseJson<T>(
  response: Response,
  method: string,
  path: string,
): Promise<SyncResult<T>> {
  try {
    return { data: (await response.json()) as T, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: "invalid_response",
        method,
        path,
        status: response.status,
        message: "Response body is not valid JSON",
      },
    };
  }
}

// A locally-cached token can still parse fine (so screens like Account keep
// showing "signed in") even after the server has started rejecting it — the
// only place that's actually visible is a 401 from a live request. This is a
// tiny pub/sub so any screen can show a "please sign in again" prompt without
// polling, instead of the failure only ever reaching a console.error.
type ReauthListener = (needsReauth: boolean) => void;
const reauthListeners = new Set<ReauthListener>();
let needsReauth = false;

function setNeedsReauth(value: boolean): void {
  if (needsReauth === value) return;
  needsReauth = value;
  for (const listener of reauthListeners) listener(value);
}

export function getNeedsReauth(): boolean {
  return needsReauth;
}

export function subscribeNeedsReauth(listener: ReauthListener): () => void {
  reauthListeners.add(listener);
  return () => reauthListeners.delete(listener);
}

// True once a live request has come back 401 (session expired/revoked
// server-side); false again as soon as a request succeeds. Prefer this over
// "is there a token in SecureStore" checks, which stay true even after the
// server has stopped accepting that token.
export function useNeedsReauth(): boolean {
  const [value, setValue] = useState(getNeedsReauth());
  useEffect(() => subscribeNeedsReauth(setValue), []);
  return value;
}

async function authedRequest(
  path: string,
  init: RequestInit = {},
): Promise<SyncResult<Response>> {
  const method = init.method ?? "GET";
  if (!isSyncConfigured()) {
    return {
      data: null,
      error: {
        code: "unconfigured",
        method,
        path,
        message: "Sync API base URL is not configured",
      },
    };
  }

  const tokens = await getStoredTokens();
  if (!tokens) {
    return {
      data: null,
      error: {
        code: "signed_out",
        method,
        path,
        message: "User is signed out",
      },
    };
  }

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
    if (!res.ok) {
      if (res.status === 401) setNeedsReauth(true);
      const body = await res.clone().text().catch(() => "");
      return {
        data: null,
        error: {
          code: mapStatusToCode(res.status),
          method,
          path,
          status: res.status,
          message: "Request failed",
          details: body,
        },
      };
    }
    setNeedsReauth(false);
    return { data: res, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: "network",
        method,
        path,
        message: "Network request failed",
      },
    };
  }
}

async function pullSettings(): Promise<SyncedSettings | null> {
  const req = await authedRequest("/settings");
  if (req.error) {
    logSyncError(req.error);
    return null;
  }
  const parsed = await parseJson<SyncedSettings>(req.data, "GET", "/settings");
  if (parsed.error) {
    logSyncError(parsed.error);
    return null;
  }
  return parsed.data;
}

export async function pushSettings(
  settings: VSSettings,
  updatedAt: string,
): Promise<void> {
  const req = await authedRequest("/settings", {
    method: "PUT",
    body: JSON.stringify({ ...settings, updatedAt }),
  });
  if (req.error) logSyncError(req.error);
}

export async function pushSession(
  record: SessionRecord,
  goalPerDay: number,
): Promise<LifetimeStats | null> {
  const req = await authedRequest("/sessions", {
    method: "POST",
    body: JSON.stringify({ ...record, goalPerDay }),
  });
  if (req.error) {
    logSyncError(req.error);
    return null;
  }
  const parsed = await parseJson<{ stats?: LifetimeStats }>(
    req.data,
    "POST",
    "/sessions",
  );
  if (parsed.error) {
    logSyncError(parsed.error);
    return null;
  }
  return parsed.data?.stats ?? null;
}

export async function pullProfileResult(): Promise<SyncResult<UserProfile | null>> {
  const req = await authedRequest("/profile");
  if (req.error) {
    if (req.error.code === "not_found") return { data: null, error: null };
    return { data: null, error: req.error };
  }
  return parseJson<UserProfile>(req.data, "GET", "/profile");
}

export async function pushProfileResult(
  profile: UserProfile,
): Promise<SyncResult<UserProfile>> {
  const req = await authedRequest("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  if (req.error) return { data: null, error: req.error };
  return parseJson<UserProfile>(req.data, "PUT", "/profile");
}

export async function fetchLeaderboardResult(): Promise<
  SyncResult<LeaderboardEntry[]>
> {
  const req = await authedRequest("/leaderboard");
  if (req.error) return { data: null, error: req.error };
  const parsed = await parseJson<{ entries?: LeaderboardEntry[] }>(
    req.data,
    "GET",
    "/leaderboard",
  );
  if (parsed.error) return { data: null, error: parsed.error };
  return { data: parsed.data?.entries ?? [], error: null };
}

export async function createGroupResult(name: string): Promise<SyncResult<Group>> {
  const req = await authedRequest("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (req.error) return { data: null, error: req.error };
  return parseJson<Group>(req.data, "POST", "/groups");
}

export async function fetchGroupsResult(): Promise<SyncResult<Group[]>> {
  const req = await authedRequest("/groups");
  if (req.error) return { data: null, error: req.error };
  const parsed = await parseJson<{ groups?: Group[] }>(req.data, "GET", "/groups");
  if (parsed.error) return { data: null, error: parsed.error };
  return { data: parsed.data?.groups ?? [], error: null };
}

export async function joinGroupResult(groupId: string): Promise<SyncResult<Group>> {
  const path = `/groups/${encodeURIComponent(groupId)}/join`;
  const req = await authedRequest(path, { method: "POST" });
  if (req.error) return { data: null, error: req.error };
  return parseJson<Group>(req.data, "POST", path);
}

export async function leaveGroupResult(groupId: string): Promise<SyncResult<{ groupId: string }>> {
  const path = `/groups/${encodeURIComponent(groupId)}/leave`;
  const req = await authedRequest(path, { method: "POST" });
  if (req.error) return { data: null, error: req.error };
  return parseJson<{ groupId: string }>(req.data, "POST", path);
}

export async function fetchGroupLeaderboardResult(
  groupId: string,
): Promise<SyncResult<LeaderboardEntry[]>> {
  const path = `/groups/${encodeURIComponent(groupId)}/leaderboard`;
  const req = await authedRequest(path);
  if (req.error) return { data: null, error: req.error };
  const parsed = await parseJson<{ entries?: LeaderboardEntry[] }>(
    req.data,
    "GET",
    path,
  );
  if (parsed.error) return { data: null, error: parsed.error };
  return { data: parsed.data?.entries ?? [], error: null };
}

export async function fetchSessionsResult(): Promise<SyncResult<SessionRecord[]>> {
  const req = await authedRequest("/sessions");
  if (req.error) return { data: null, error: req.error };
  const parsed = await parseJson<{ records?: SessionRecord[] }>(
    req.data,
    "GET",
    "/sessions",
  );
  if (parsed.error) return { data: null, error: parsed.error };
  return { data: parsed.data?.records ?? [], error: null };
}

export async function pullProfile(): Promise<UserProfile | null> {
  const result = await pullProfileResult();
  if (result.error) {
    logSyncError(result.error);
    return null;
  }
  return result.data;
}

export async function pushProfile(
  profile: UserProfile,
): Promise<UserProfile | null> {
  const result = await pushProfileResult(profile);
  if (result.error) {
    logSyncError(result.error);
    return null;
  }
  return result.data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const result = await fetchLeaderboardResult();
  if (result.error) {
    logSyncError(result.error);
    return null;
  }
  return result.data;
}

function mergeSessionHistory(
  local: SessionRecord[],
  remote: SessionRecord[],
): SessionRecord[] {
  const byCompletedAt = new Map<string, SessionRecord>();
  for (const rec of [...local, ...remote]) {
    byCompletedAt.set(rec.completedAt, rec);
  }
  return Array.from(byCompletedAt.values()).sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  );
}

export async function syncSessionHistoryNow(): Promise<void> {
  const remote = await fetchSessionsResult();
  if (remote.error) {
    if (remote.error.code !== "signed_out" && remote.error.code !== "unconfigured") {
      logSyncError(remote.error);
    }
    return;
  }
  const local = await loadHistory();
  const merged = mergeSessionHistory(local, remote.data);
  await saveHistory(merged);
  await saveTodayProgress(buildTodayProgressFromHistory(merged));
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
