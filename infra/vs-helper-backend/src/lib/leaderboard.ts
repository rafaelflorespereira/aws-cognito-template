import type { LifetimeStats, UserProfile } from "@vs/shared";

export const LEADERBOARD_GSI = "gsi1";
export const LEADERBOARD_PK_VALUE = "LEADERBOARD";

// Stats items are always fully replaced (PutCommand), so building the item
// through this single function is what keeps the denormalized leaderboard
// fields (docs/vs-helper-architecture.md §12.3) consistent: present and
// current when the user is opted in, absent otherwise (which drops them out
// of the GSI automatically — DynamoDB only indexes items that have the GSI's
// key attributes).
export function buildStatsItem(
  userId: string,
  stats: LifetimeStats,
  profile: UserProfile | null,
): Record<string, unknown> {
  const item: Record<string, unknown> = { userId, ...stats };
  if (profile?.leaderboardOptIn && profile.handle) {
    item.gsi1pk = LEADERBOARD_PK_VALUE;
    item.gsi1sk = stats.totalSessions;
    item.handle = profile.handle;
  }
  return item;
}
