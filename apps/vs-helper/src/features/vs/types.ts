// Settings, session history and lifetime stats are shared with the cloud sync
// backend (packages/vs-shared) so both sides agree on shape and streak logic.
export type { VSSettings, SessionRecord, LifetimeStats } from "@vs/shared";

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

export interface Achievement {
  id: string; // "first-vs", "century", "streak-7", ...
  unlockedAt: string | null; // ISO when unlocked; null while locked
}
