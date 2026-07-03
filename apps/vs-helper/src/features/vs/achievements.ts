import type { Achievement, LifetimeStats } from "./types";

// Catalog of achievements (all locked by default). `unlockedAt` is set by
// evaluateAchievements once the corresponding condition is met. Titles and
// descriptions are translated at render time via i18n keys
// `achievement.<id>.title` / `achievement.<id>.desc`.
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-vs", unlockedAt: null },
  { id: "ten", unlockedAt: null },
  { id: "century", unlockedAt: null },
  { id: "streak-3", unlockedAt: null },
  { id: "streak-7", unlockedAt: null },
  { id: "days-30", unlockedAt: null },
];

const CONDITIONS: Record<string, (s: LifetimeStats) => boolean> = {
  "first-vs": (s) => s.totalSessions >= 1,
  ten: (s) => s.totalSessions >= 10,
  century: (s) => s.totalSessions >= 100,
  "streak-3": (s) => s.bestStreak >= 3,
  "streak-7": (s) => s.bestStreak >= 7,
  "days-30": (s) => s.daysActive >= 30,
};

/**
 * Returns the achievements list with any newly-satisfied ones unlocked
 * (unlockedAt set to now). Already-unlocked achievements are preserved.
 */
export function evaluateAchievements(
  stats: LifetimeStats,
  current: Achievement[],
): Achievement[] {
  const now = new Date().toISOString();
  const byId = new Map(current.map((a) => [a.id, a]));
  return ACHIEVEMENTS.map((base) => {
    const existing = byId.get(base.id);
    const unlockedAt = existing?.unlockedAt ?? null;
    if (unlockedAt) return { ...base, unlockedAt };
    const met = CONDITIONS[base.id]?.(stats) ?? false;
    return { ...base, unlockedAt: met ? now : null };
  });
}
