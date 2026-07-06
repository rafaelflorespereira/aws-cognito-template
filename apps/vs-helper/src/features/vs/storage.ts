import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  VSSettings,
  DailyProgress,
  SessionReport,
  SessionRecord,
} from "./types";

const KEYS = {
  settings: "vs.settings",
  settingsUpdatedAt: "vs.settings.updatedAt",
  progress: "vs.progress",
  reports: "vs.reports",
  history: "vs.history",
};

export const DEFAULT_SETTINGS: VSSettings = {
  timesPerDay: 20,
  firstTime: "07:00",
  lastTime: "22:00",
  sessionDurationSec: 120,
  notificationsEnabled: true,
  showGuidedSteps: true,
  configured: false,
};

export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadSettings(): Promise<VSSettings> {
  const stored = await readJSON<Partial<VSSettings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

// Every local save is stamped with an `updatedAt` so cloud sync (features/vs/sync.ts)
// can resolve last-write-wins across devices. Pass an explicit `updatedAt` when
// applying a settings payload pulled from the server, so its own timestamp is
// preserved instead of being overwritten with "now".
export async function saveSettings(
  s: VSSettings,
  updatedAt: string = new Date().toISOString(),
): Promise<string> {
  await AsyncStorage.multiSet([
    [KEYS.settings, JSON.stringify(s)],
    [KEYS.settingsUpdatedAt, updatedAt],
  ]);
  return updatedAt;
}

export async function loadSettingsUpdatedAt(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.settingsUpdatedAt)) ?? "";
}

export async function loadTodayProgress(): Promise<DailyProgress> {
  const today = todayStr();
  const stored = await readJSON<DailyProgress | null>(KEYS.progress, null);
  if (stored && stored.date === today) return stored;
  // New day (or first run): reset progress.
  const fresh: DailyProgress = {
    date: today,
    completed: 0,
    completedSlots: [],
    lastCompletedAt: null,
  };
  await AsyncStorage.setItem(KEYS.progress, JSON.stringify(fresh));
  return fresh;
}

export async function markSlotDone(slot: string): Promise<DailyProgress> {
  const progress = await loadTodayProgress();
  // Count every completed session, even repeats of the same slot: finishing a
  // practice always advances today's X/target counter by one.
  progress.completedSlots.push(slot);
  progress.completed = progress.completedSlots.length;
  progress.lastCompletedAt = new Date().toISOString();
  await AsyncStorage.setItem(KEYS.progress, JSON.stringify(progress));
  return progress;
}

export async function saveReport(r: SessionReport): Promise<void> {
  const reports = await readJSON<SessionReport[]>(KEYS.reports, []);
  reports.push(r);
  await AsyncStorage.setItem(KEYS.reports, JSON.stringify(reports));
}

export async function loadReports(): Promise<SessionReport[]> {
  return readJSON<SessionReport[]>(KEYS.reports, []);
}

export async function appendSessionRecord(r: SessionRecord): Promise<void> {
  const history = await readJSON<SessionRecord[]>(KEYS.history, []);
  history.push(r);
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(history));
}

export async function loadHistory(): Promise<SessionRecord[]> {
  return readJSON<SessionRecord[]>(KEYS.history, []);
}
