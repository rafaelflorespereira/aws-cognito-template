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
  adaptiveSlots,
  nextSlot,
  nextDueDate,
  currentSpacingMin,
  toHHMM,
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
    // When the practice actually started (defaults to now). Pass this so a
    // session is logged at the time the user began it, not whenever this
    // function happens to run after the countdown finishes.
    completedAt?: Date;
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

  const adaptiveInput = useMemo(
    () => ({
      timesPerDay: settings.timesPerDay,
      firstTime: settings.firstTime,
      lastTime: settings.lastTime,
      completed: progress.completed,
      lastCompletedAt: progress.lastCompletedAt,
      completedSlots: progress.completedSlots,
    }),
    [
      settings.timesPerDay,
      settings.firstTime,
      settings.lastTime,
      progress.completed,
      progress.lastCompletedAt,
      progress.completedSlots,
    ],
  );

  // Remaining slots reflow around the last completion instead of staying
  // pinned to the original fixed grid — see adaptiveSlots in schedule.ts.
  const slots = useMemo(
    () => adaptiveSlots(settings, adaptiveInput, now),
    [settings, adaptiveInput, now],
  );
  const next = useMemo(() => nextSlot(slots, now), [slots, now]);

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
    async (opts?: {
      slot?: string;
      report?: SessionReport;
      completedAt?: Date;
    }) => {
      // Label the completion with the actual clock time it happened at (not
      // the adaptively-computed "next" slot) — practicing ahead of or behind
      // schedule logs a new slot at the real time, and adaptiveSlots reflows
      // the remaining, not-yet-done slots around it. Defaults to now, but
      // callers should pass when the session actually started so a session
      // isn't logged a couple of minutes late once its countdown finishes.
      const completedAt = opts?.completedAt ?? new Date();
      const slot =
        opts?.slot ??
        toHHMM(completedAt.getHours() * 60 + completedAt.getMinutes());
      const updated = await markSlotDone(slot, completedAt);
      setProgress(updated);
      const record: SessionRecord = {
        date: updated.date,
        slot,
        completedAt: completedAt.toISOString(),
      };
      await appendSessionRecord(record);
      if (opts?.report) await saveReport(opts.report);
      void pushSession(record, settings.timesPerDay);
      return slot;
    },
    [settings.timesPerDay],
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
