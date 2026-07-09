import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  VSSettings,
  DailyProgress,
  SessionReport,
  SessionRecord,
} from "./types";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  loadTodayProgress,
  markSlotDone,
  appendSessionRecord,
  saveReport,
  todayStr,
} from "./storage";
import {
  computeSlots,
  nextSlot,
  nextDueDate,
  currentSpacingMin,
} from "./schedule";
import { rescheduleAll, cancelAll, requestPermission } from "./notifications";
import {
  pushSession,
  pushSettings,
  syncSessionHistoryNow,
  syncSettingsNow,
} from "./sync";
import { useI18n } from "../i18n";

export interface UseSchedule {
  settings: VSSettings;
  configured: boolean; // drives the first-run redirect in _layout
  loading: boolean;
  slots: string[];
  next: string | null;
  nextDue: Date | null; // adaptive recommended time for the next session
  spacingMin: number; // adaptive minutes between remaining sessions
  progress: DailyProgress;
  refresh: () => Promise<void>;
  updateSettings: (partial: Partial<VSSettings>) => Promise<void>;
  // Marks the current (or given) slot complete, records it, and optionally saves
  // a report. Returns the slot label used.
  completeCurrent: (opts?: {
    slot?: string;
    report?: SessionReport;
  }) => Promise<string>;
}

export function useSchedule(): UseSchedule {
  const { t } = useI18n();
  const [settings, setSettings] = useState<VSSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<DailyProgress>({
    date: todayStr(),
    completed: 0,
    completedSlots: [],
    lastCompletedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    const [s, p] = await Promise.all([loadSettings(), loadTodayProgress()]);
    setSettings(s);
    setProgress(p);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Reconcile with the cloud sync backend once the initial local load settles
  // (no-op if signed out or sync isn't configured — see features/vs/sync.ts).
  useEffect(() => {
    if (loading) return;
    Promise.all([syncSettingsNow(), syncSessionHistoryNow()]).then(([applied]) => {
      if (applied) setSettings(applied);
      void refresh();
    });
  }, [loading, refresh]);

  // Tick every 30s so `next` stays fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const slots = useMemo(() => computeSlots(settings), [settings]);
  const next = useMemo(() => nextSlot(slots, now), [slots, now]);

  const adaptiveInput = useMemo(
    () => ({
      timesPerDay: settings.timesPerDay,
      firstTime: settings.firstTime,
      lastTime: settings.lastTime,
      completed: progress.completed,
      lastCompletedAt: progress.lastCompletedAt,
    }),
    [
      settings.timesPerDay,
      settings.firstTime,
      settings.lastTime,
      progress.completed,
      progress.lastCompletedAt,
    ],
  );
  const nextDue = useMemo(
    () => nextDueDate(adaptiveInput, now),
    [adaptiveInput, now],
  );
  const spacingMin = useMemo(
    () => currentSpacingMin(adaptiveInput, now),
    [adaptiveInput, now],
  );

  const updateSettings = useCallback(
    async (partial: Partial<VSSettings>) => {
      const merged: VSSettings = { ...settings, ...partial };
      setSettings(merged);
      const updatedAt = await saveSettings(merged);

      const newSlots = computeSlots(merged);
      if (merged.notificationsEnabled) {
        const granted = await requestPermission();
        if (granted)
          await rescheduleAll(newSlots, {
            title: t("notif.title"),
            body: t("notif.body"),
          });
      } else {
        await cancelAll();
      }

      void pushSettings(merged, updatedAt);
    },
    [settings, t],
  );

  const completeCurrent = useCallback(
    async (opts?: { slot?: string; report?: SessionReport }) => {
      const slot = opts?.slot ?? next ?? slots[progress.completed] ?? "manual";
      const updated = await markSlotDone(slot);
      setProgress(updated);
      const record: SessionRecord = {
        date: updated.date,
        slot,
        completedAt: new Date().toISOString(),
      };
      await appendSessionRecord(record);
      if (opts?.report) await saveReport(opts.report);
      void pushSession(record, settings.timesPerDay);
      return slot;
    },
    [next, slots, progress.completed, settings.timesPerDay],
  );

  return {
    settings,
    configured: settings.configured,
    loading,
    slots,
    next,
    nextDue,
    spacingMin,
    progress,
    refresh,
    updateSettings,
    completeCurrent,
  };
}
