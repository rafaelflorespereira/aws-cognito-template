// Types shared between the VS app (on-device) and the cloud sync backend.
// See docs/vs-helper-architecture.md §12 for the on-device <-> cloud mapping.

export interface VSSettings {
  timesPerDay: number;
  firstTime: string; // "HH:mm"
  lastTime: string; // "HH:mm"
  sessionDurationSec: number; // length of one VS session; default 120 (2 min)
  notificationsEnabled: boolean;
  showGuidedSteps: boolean;
  audioGuideEnabled: boolean; // speak each maneuver aloud during practice
  configured: boolean; // false until the user completes first-run onboarding
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
