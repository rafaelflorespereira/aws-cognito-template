// Types shared between the VS app (on-device) and the cloud sync backend.
// See docs/vs-helper-architecture.md §12 for the on-device <-> cloud mapping.

export const VOICE_GENDERS = ["female"] as const;
export type VoiceGender = (typeof VOICE_GENDERS)[number];

export interface VSSettings {
  timesPerDay: number;
  firstTime: string; // "HH:mm"
  lastTime: string; // "HH:mm"
  sessionDurationSec: number; // length of one VS session; default 120 (2 min)
  notificationsEnabled: boolean;
  showGuidedSteps: boolean;
  audioGuideEnabled: boolean; // speak each maneuver aloud during practice
  voiceGender: VoiceGender; // narrator voice; best-effort match per device
  reportSyncOptIn: boolean; // opt-in: sync post-session Reports to the cloud (§12.2, sensitive)
  configured: boolean; // false until the user completes first-run onboarding
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

// Post-session reflection. Sensitive — only synced when VSSettings.reportSyncOptIn
// is true (docs/vs-helper-architecture.md §12.2).
export interface SessionReport {
  slot: string; // "HH:mm" slot the session belonged to
  completedAt: string; // ISO timestamp — idempotency key when synced
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

// Leaderboard opt-in profile, keyed by the same Cognito `sub` as everything
// else. Only `handle` + coarse counts are ever shown publicly — see
// docs/vs-helper-architecture.md §11/§12.3.
export interface UserProfile {
  handle: string; // public leaderboard name; "" until the user sets one
  leaderboardOptIn: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  isYou: boolean;
}

// A private, invite-code championship group. `groupId` doubles as the
// shareable join code. Group leaderboard entries reuse LeaderboardEntry —
// same shape (rank/handle/coarse counts), just scoped to group members
// instead of the global opt-in board.
export interface Group {
  groupId: string;
  name: string;
}
