import type { Achievement, AchievementCategory, AchievementTier, LifetimeStats } from "./types";

// Catalog of achievements (all locked by default). `unlockedAt` is set by
// evaluateAchievements once the corresponding condition is met, and is
// preserved across calls as long as callers pass in the previously
// persisted list (see storage.ts loadAchievements/saveAchievements) rather
// than this static catalog — otherwise every unlock timestamp would read as
// "now" on every evaluation instead of the real unlock date. Titles and
// descriptions are translated at render time via i18n keys
// `achievement.<id>.title` / `achievement.<id>.desc`.
interface AchievementDef {
  id: string;
  tier: AchievementTier;
  category: AchievementCategory;
  condition: (s: LifetimeStats) => boolean;
}

const DEFS: AchievementDef[] = [
  // Practice count — total Vibrational States completed.
  { id: "practice-1", tier: "bronze", category: "practice", condition: (s) => s.totalSessions >= 1 },
  { id: "practice-10", tier: "bronze", category: "practice", condition: (s) => s.totalSessions >= 10 },
  { id: "practice-50", tier: "silver", category: "practice", condition: (s) => s.totalSessions >= 50 },
  { id: "practice-100", tier: "silver", category: "practice", condition: (s) => s.totalSessions >= 100 },
  { id: "practice-250", tier: "gold", category: "practice", condition: (s) => s.totalSessions >= 250 },
  { id: "practice-500", tier: "gold", category: "practice", condition: (s) => s.totalSessions >= 500 },
  { id: "practice-1000", tier: "platinum", category: "practice", condition: (s) => s.totalSessions >= 1000 },

  // Streak — best run of consecutive days meeting the daily goal.
  { id: "streak-3", tier: "bronze", category: "streak", condition: (s) => s.bestStreak >= 3 },
  { id: "streak-7", tier: "bronze", category: "streak", condition: (s) => s.bestStreak >= 7 },
  { id: "streak-14", tier: "silver", category: "streak", condition: (s) => s.bestStreak >= 14 },
  { id: "streak-30", tier: "gold", category: "streak", condition: (s) => s.bestStreak >= 30 },
  { id: "streak-60", tier: "platinum", category: "streak", condition: (s) => s.bestStreak >= 60 },

  // Consistency — distinct days with at least one completed session.
  { id: "days-7", tier: "bronze", category: "consistency", condition: (s) => s.daysActive >= 7 },
  { id: "days-30", tier: "silver", category: "consistency", condition: (s) => s.daysActive >= 30 },
  { id: "days-90", tier: "gold", category: "consistency", condition: (s) => s.daysActive >= 90 },
  { id: "days-180", tier: "gold", category: "consistency", condition: (s) => s.daysActive >= 180 },
  { id: "days-365", tier: "platinum", category: "consistency", condition: (s) => s.daysActive >= 365 },
];

export const ACHIEVEMENTS: Achievement[] = DEFS.map(({ id, tier, category }) => ({
  id,
  tier,
  category,
  unlockedAt: null,
}));

/**
 * Returns the achievements list with any newly-satisfied ones unlocked
 * (unlockedAt set to now). Already-unlocked achievements are preserved —
 * pass in the previously persisted list as `current` so unlock timestamps
 * stay stable across calls instead of resetting to "now" every time.
 */
export function evaluateAchievements(
  stats: LifetimeStats,
  current: Achievement[],
): Achievement[] {
  const now = new Date().toISOString();
  const byId = new Map(current.map((a) => [a.id, a]));
  return DEFS.map((def) => {
    const existing = byId.get(def.id);
    const unlockedAt = existing?.unlockedAt ?? null;
    const base: Achievement = {
      id: def.id,
      tier: def.tier,
      category: def.category,
      unlockedAt,
    };
    if (unlockedAt) return base;
    const met = def.condition(stats);
    return { ...base, unlockedAt: met ? now : null };
  });
}

// Ids unlocked in `next` but not in `prev` — used to trigger the unlock
// celebration for only the achievements that just newly cleared.
export function newlyUnlocked(prev: Achievement[], next: Achievement[]): Achievement[] {
  const prevUnlocked = new Set(
    prev.filter((a) => a.unlockedAt).map((a) => a.id),
  );
  return next.filter((a) => a.unlockedAt && !prevUnlocked.has(a.id));
}
