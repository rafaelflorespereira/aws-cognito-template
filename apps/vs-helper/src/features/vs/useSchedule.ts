import { useCallback, useEffect, useMemo, useState } from "react";
import type { VSSettings, DailyProgress, SessionReport } from "./types";
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
import { computeSlots, nextSlot } from "./schedule";
import { rescheduleAll, cancelAll, requestPermission } from "./notifications";

export interface UseSchedule {
  settings: VSSettings;
  configured: boolean; // drives the first-run redirect in _layout
  loading: boolean;
  slots: string[];
  next: string | null;
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
  const [settings, setSettings] = useState<VSSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<DailyProgress>({
    date: todayStr(),
    completed: 0,
    completedSlots: [],
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

  // Tick every 30s so `next` stays fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const slots = useMemo(() => computeSlots(settings), [settings]);
  const next = useMemo(() => nextSlot(slots, now), [slots, now]);

  const updateSettings = useCallback(
    async (partial: Partial<VSSettings>) => {
      const merged: VSSettings = { ...settings, ...partial };
      setSettings(merged);
      await saveSettings(merged);

      const newSlots = computeSlots(merged);
      if (merged.notificationsEnabled) {
        const granted = await requestPermission();
        if (granted) await rescheduleAll(newSlots);
      } else {
        await cancelAll();
      }
    },
    [settings],
  );

  const completeCurrent = useCallback(
    async (opts?: { slot?: string; report?: SessionReport }) => {
      const slot = opts?.slot ?? next ?? slots[progress.completed] ?? "manual";
      const updated = await markSlotDone(slot);
      setProgress(updated);
      await appendSessionRecord({
        date: updated.date,
        slot,
        completedAt: new Date().toISOString(),
      });
      if (opts?.report) await saveReport(opts.report);
      return slot;
    },
    [next, slots, progress.completed],
  );

  return {
    settings,
    configured: settings.configured,
    loading,
    slots,
    next,
    progress,
    refresh,
    updateSettings,
    completeCurrent,
  };
}
