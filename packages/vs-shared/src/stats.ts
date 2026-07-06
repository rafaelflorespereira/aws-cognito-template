import type { SessionRecord, LifetimeStats } from "./types";

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Aggregates the flat session history into lifetime stats. A day counts toward a
 * streak when it reaches `goalPerDay` completed sessions. The current streak is
 * the run of qualifying days ending today (or yesterday, if today isn't done yet).
 *
 * Pure and platform-agnostic so it can run both on-device (app) and in the
 * cloud sync Lambda (recomputed server-side after each session sync).
 */
export function computeStats(
  history: SessionRecord[],
  goalPerDay: number,
): LifetimeStats {
  const perDay = new Map<string, number>();
  for (const r of history) {
    perDay.set(r.date, (perDay.get(r.date) ?? 0) + 1);
  }

  const dates = [...perDay.keys()].sort();
  const goal = Math.max(1, goalPerDay);
  const qualifying = dates.filter((d) => (perDay.get(d) ?? 0) >= goal);

  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of qualifying) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }

  // Current streak: walk back from today over qualifying days.
  const qualifyingSet = new Set(qualifying);
  let currentStreak = 0;
  const today = todayStr();
  let cursor = qualifyingSet.has(today)
    ? today
    : // allow the streak to still be "alive" if only yesterday qualifies
      qualifyingSet.has(shiftDay(today, -1))
      ? shiftDay(today, -1)
      : null;
  while (cursor && qualifyingSet.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDay(cursor, -1);
  }

  return {
    totalSessions: history.length,
    daysActive: dates.length,
    currentStreak,
    bestStreak,
    lastActiveDate: dates.length ? dates[dates.length - 1] : "",
  };
}

function shiftDay(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return todayStr(d);
}
