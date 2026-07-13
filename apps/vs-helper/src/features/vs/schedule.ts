// Tally completed sessions per "YYYY-MM-DD" date, for the weekly progress strip.
export function sessionCountsByDate(
  history: { date: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of history) counts[r.date] = (counts[r.date] ?? 0) + 1;
  return counts;
}

export interface ScheduleConfig {
  timesPerDay: number; // e.g. 20
  firstTime: string; // "HH:mm" e.g. "07:00"
  lastTime: string; // "HH:mm" e.g. "22:00"
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toHHMM(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Returns "HH:mm" slots evenly spaced from firstTime..lastTime (inclusive), so
 * the day's practices are distributed throughout the first–last window.
 * Spacing: with n times inclusive, the interval is (last - first) / (n - 1).
 */
export function computeSlots(config: ScheduleConfig): string[] {
  const n = Math.max(1, Math.floor(config.timesPerDay));
  const start = toMinutes(config.firstTime);
  const end = toMinutes(config.lastTime);

  if (n === 1 || end <= start) return [toHHMM(start)];

  const interval = (end - start) / (n - 1);
  const slots: string[] = [];
  for (let i = 0; i < n; i++) slots.push(toHHMM(start + interval * i));
  return slots;
}

// Given the slots and the current time, return the next upcoming slot (or null).
export function nextSlot(slots: string[], now: Date): string | null {
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const s of slots) {
    if (toMinutes(s) > cur) return s;
  }
  return null;
}

// Build a Date for today at "HH:mm" (local).
export function atTimeToday(now: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(now);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export interface AdaptiveInput {
  timesPerDay: number;
  firstTime: string;
  lastTime: string;
  completed: number;
  lastCompletedAt: string | null;
  completedSlots: string[];
}

/**
 * Recommended next practice time for today (adaptive), or null when the day's
 * target is already met. The remaining sessions are spread evenly across the
 * time left in the window, re-anchored on the last completion — so doing one
 * early stretches the gap and falling behind compresses it.
 */
export function nextDueDate(input: AdaptiveInput, now: Date): Date | null {
  const target = Math.max(1, Math.floor(input.timesPerDay));
  if (input.completed >= target) return null;

  const start = atTimeToday(now, input.firstTime);
  const end = atTimeToday(now, input.lastTime);

  // Before any practice today, the first one is due at the window start.
  if (input.completed === 0 || !input.lastCompletedAt) return start;

  const anchor = new Date(input.lastCompletedAt);
  const remaining = target - input.completed;
  const msLeft = end.getTime() - anchor.getTime();
  if (msLeft <= 0) return null; // past the window; nothing more scheduled today
  return new Date(anchor.getTime() + msLeft / remaining);
}

/** Current spacing in minutes between the remaining sessions (for display). */
export function currentSpacingMin(input: AdaptiveInput, now: Date): number {
  const target = Math.max(1, Math.floor(input.timesPerDay));
  const start = atTimeToday(now, input.firstTime);
  const end = atTimeToday(now, input.lastTime);
  const totalWindowMs = Math.max(1, end.getTime() - start.getTime());

  const useAnchor = input.completed > 0 && input.lastCompletedAt;
  const anchor = useAnchor ? new Date(input.lastCompletedAt as string) : start;
  const remaining = Math.max(1, target - input.completed);
  const msLeft = useAnchor
    ? Math.max(0, end.getTime() - anchor.getTime()) || totalWindowMs
    : totalWindowMs;
  return Math.max(1, Math.round(msLeft / remaining / 60000));
}

/**
 * Every one of today's `timesPerDay` slot times, as "HH:mm". Sessions already
 * completed keep the fixed evenly-spaced grid label they were logged
 * against, but the not-yet-done ones are re-spread across the time left in
 * the window, anchored on the last completion (same math as `nextDueDate`) —
 * so logging a session now reflows the rest of the day instead of leaving it
 * pinned to the original fixed grid.
 */
export function adaptiveSlots(
  config: ScheduleConfig,
  input: AdaptiveInput,
  now: Date,
): string[] {
  const target = Math.max(1, Math.floor(config.timesPerDay));
  const done = Math.min(Math.max(0, Math.floor(input.completed)), target);
  // The recorded label for each completion is whatever `next` adaptively
  // resolved to *at that moment* (see completeCurrent in useSchedule.ts), so
  // it drifts from the fixed grid after the first reschedule. Use the actual
  // recorded labels here — not the fixed grid — or the stepper below can't
  // match a real completion back to "done".
  const doneSlots = [...input.completedSlots].sort();

  const remaining = target - done;
  if (remaining <= 0) return doneSlots;

  const start = atTimeToday(now, config.firstTime);
  const end = atTimeToday(now, config.lastTime);
  const anchor =
    done === 0 || !input.lastCompletedAt
      ? start
      : new Date(input.lastCompletedAt);
  const msLeft = end.getTime() - anchor.getTime();
  if (msLeft <= 0) return doneSlots; // past the window; nothing more scheduled today

  const upcoming = Array.from({ length: remaining }, (_, i) => {
    const t = new Date(anchor.getTime() + (msLeft * (i + 1)) / remaining);
    return toHHMM(t.getHours() * 60 + t.getMinutes());
  });
  return [...doneSlots, ...upcoming];
}
