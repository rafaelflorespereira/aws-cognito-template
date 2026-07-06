import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { LifetimeStats, UserProfile } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";
import { buildStatsItem } from "../lib/leaderboard";

// Public leaderboard names only — keep them short and free of anything that
// could carry an email/real name accidentally pasted in.
const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

const ZERO_STATS: LifetimeStats = {
  totalSessions: 0,
  daysActive: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: "",
};

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  let profile: UserProfile;
  try {
    profile = parseBody(event.body);
  } catch (err) {
    return json(400, { message: (err as Error).message });
  }

  const claims = event.requestContext.authorizer.jwt.claims;
  const now = new Date().toISOString();

  const { Item: existingUser } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId } }),
  );

  await ddb.send(
    new PutCommand({
      TableName: TABLES.users,
      Item: {
        userId,
        email: typeof claims.email === "string" ? claims.email : "",
        name: typeof claims.name === "string" ? claims.name : "",
        picture: typeof claims.picture === "string" ? claims.picture : "",
        handle: profile.handle,
        leaderboardOptIn: profile.leaderboardOptIn,
        createdAt: existingUser?.createdAt ?? now,
        updatedAt: now,
      },
    }),
  );

  // Keep Stats' denormalized handle/GSI fields in lockstep with the profile —
  // see src/lib/leaderboard.ts. Stats may not exist yet if the user hasn't
  // completed a session; seed a zeroed row so an opt-in still shows up.
  const { Item: existingStats } = await ddb.send(
    new GetCommand({ TableName: TABLES.stats, Key: { userId } }),
  );
  const stats: LifetimeStats = existingStats
    ? {
        totalSessions: existingStats.totalSessions,
        daysActive: existingStats.daysActive,
        currentStreak: existingStats.currentStreak,
        bestStreak: existingStats.bestStreak,
        lastActiveDate: existingStats.lastActiveDate,
      }
    : ZERO_STATS;

  await ddb.send(
    new PutCommand({
      TableName: TABLES.stats,
      Item: buildStatsItem(userId, stats, profile),
    }),
  );

  return json(200, profile);
};

function parseBody(body: string | undefined): UserProfile {
  if (!body) throw new Error("Missing request body");
  const parsed = JSON.parse(body);

  if (typeof parsed.leaderboardOptIn !== "boolean") {
    throw new Error('Field "leaderboardOptIn" must be a boolean');
  }
  if (typeof parsed.handle !== "string") {
    throw new Error('Field "handle" must be a string');
  }
  if (parsed.leaderboardOptIn && !HANDLE_RE.test(parsed.handle)) {
    throw new Error(
      'Field "handle" must be 3-20 letters, digits, or underscores to opt into the leaderboard',
    );
  }

  return { handle: parsed.handle, leaderboardOptIn: parsed.leaderboardOptIn };
}
