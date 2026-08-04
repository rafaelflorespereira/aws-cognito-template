// Settings, session/report history and lifetime stats are shared with the
// cloud sync backend (packages/vs-shared) so both sides agree on shape and
// streak logic.
export type {
  VSSettings,
  SessionRecord,
  LifetimeStats,
  Chakra,
  SessionReport,
} from "@vs/shared";

export interface DailyProgress {
  date: string; // "YYYY-MM-DD" (local)
  completed: number; // sessions done today
  completedSlots: string[]; // "HH:mm" slots logged, one per completed session (may repeat)
  lastCompletedAt: string | null; // ISO of the most recent completion today
}

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";
export type AchievementCategory = "practice" | "streak" | "consistency";

export interface Achievement {
  id: string; // "first-vs", "century", "streak-7", ...
  tier: AchievementTier;
  category: AchievementCategory;
  unlockedAt: string | null; // ISO when unlocked; null while locked
}
