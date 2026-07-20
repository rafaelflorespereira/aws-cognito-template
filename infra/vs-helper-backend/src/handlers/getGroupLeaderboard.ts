import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { BatchGetCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { LeaderboardEntry } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

// Independent of the global leaderboard's `leaderboardOptIn` flag — joining
// a private group via its invite code is itself the opt-in for that group.
// Bounded by MAX_GROUP_MEMBERS (lib/groups.ts) so this is always a single
// Query + one BatchGetItem, no pagination needed.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);
  const groupId = event.pathParameters?.groupId;
  if (!groupId) return json(400, { message: "Missing groupId" });

  const { Item: membership } = await ddb.send(
    new GetCommand({ TableName: TABLES.groupMembers, Key: { groupId, userId } }),
  );
  if (!membership) return json(403, { message: "Not a member of this group" });

  const { Items: members } = await ddb.send(
    new QueryCommand({
      TableName: TABLES.groupMembers,
      KeyConditionExpression: "groupId = :g",
      ExpressionAttributeValues: { ":g": groupId },
    }),
  );
  const memberList = members ?? [];
  if (!memberList.length) return json(200, { entries: [] });

  const { Responses } = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLES.stats]: { Keys: memberList.map((m) => ({ userId: m.userId })) },
      },
    }),
  );
  const statsByUser = new Map(
    (Responses?.[TABLES.stats] ?? []).map((item) => [item.userId, item]),
  );

  const ranked = memberList
    .map((m) => {
      const stats = statsByUser.get(m.userId);
      return {
        userId: m.userId as string,
        handle: m.handle as string,
        totalSessions: (stats?.totalSessions as number | undefined) ?? 0,
        currentStreak: (stats?.currentStreak as number | undefined) ?? 0,
        bestStreak: (stats?.bestStreak as number | undefined) ?? 0,
      };
    })
    .sort((a, b) => b.totalSessions - a.totalSessions);

  const entries: LeaderboardEntry[] = ranked.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    totalSessions: r.totalSessions,
    currentStreak: r.currentStreak,
    bestStreak: r.bestStreak,
    isYou: r.userId === userId,
  }));

  return json(200, { entries });
};
