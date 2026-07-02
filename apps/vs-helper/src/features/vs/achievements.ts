import type { Achievement, LifetimeStats } from "./types";

// Catalog of achievements (all locked by default). `unlockedAt` is set by
// evaluateAchievements once the corresponding condition is met.
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-vs",
    title: "First Spark",
    description: "Complete your first Vibrational State.",
    unlockedAt: null,
  },
  {
    id: "ten",
    title: "Getting Warm",
    description: "Complete 10 Vibrational States.",
    unlockedAt: null,
  },
  {
    id: "century",
    title: "Century",
    description: "Complete 100 Vibrational States.",
    unlockedAt: null,
  },
  {
    id: "streak-3",
    title: "Momentum",
    description: "Meet your daily goal 3 days in a row.",
    unlockedAt: null,
  },
  {
    id: "streak-7",
    title: "Steady Practice",
    description: "Meet your daily goal 7 days in a row.",
    unlockedAt: null,
  },
  {
    id: "days-30",
    title: "Second Nature",
    description: "Practice on 30 different days.",
    unlockedAt: null,
  },
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
