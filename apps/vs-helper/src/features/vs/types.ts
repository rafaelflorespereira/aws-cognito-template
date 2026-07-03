export interface VSSettings {
  timesPerDay: number;
  firstTime: string; // "HH:mm"
  lastTime: string; // "HH:mm"
  sessionDurationSec: number; // length of one VS session; default 120 (2 min)
  notificationsEnabled: boolean;
  showGuidedSteps: boolean;
  configured: boolean; // false until the user completes first-run onboarding
}

export interface DailyProgress {
  date: string; // "YYYY-MM-DD" (local)
  completed: number; // sessions done today
  completedSlots: string[]; // "HH:mm" slots logged, one per completed session (may repeat)
  lastCompletedAt: string | null; // ISO of the most recent completion today
}

export type Chakra =
  | "coronochakra" // crown
  | "frontochakra" // brow / third eye
  | "laryngochakra" // throat
  | "cardiochakra" // heart
  | "umbilicochakra" // solar plexus
  | "sexochakra" // sacral
  | "basochakra" // root
  | "palmar" // palms
  | "plantar"; // soles

export interface SessionReport {
  slot: string; // "HH:mm" slot the session belonged to
  completedAt: string; // ISO timestamp
  chakrasActive: Chakra[]; // felt most active
  chakrasBlocked: Chakra[]; // felt blocked
  wellbeing: number; // 1..5, how well the person feels after
  perceptions: string[]; // tingling, warmth, clairvoyance, none, ...
  notes?: string; // optional free text
}

// One row per completed session, appended across days (drives stats/streaks).
export interface SessionRecord {
  date: string; // "YYYY-MM-DD" (local)
  slot: string; // "HH:mm"
  completedAt: string; // ISO timestamp
}

export interface LifetimeStats {
  totalSessions: number; // all VS ever completed
  daysActive: number; // distinct days with >=1 session
  currentStreak: number; // consecutive days meeting the daily goal
  bestStreak: number;
  lastActiveDate: string; // "YYYY-MM-DD" ("" when no history)
}

export interface Achievement {
  id: string; // "first-vs", "century", "streak-7", ...
  unlockedAt: string | null; // ISO when unlocked; null while locked
}
