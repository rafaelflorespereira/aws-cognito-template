import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { LeaderboardEntry } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";
import { LEADERBOARD_GSI, LEADERBOARD_PK_VALUE } from "../lib/leaderboard";

const LIMIT = 50;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  const { Items } = await ddb.send(
    new QueryCommand({
      TableName: TABLES.stats,
      IndexName: LEADERBOARD_GSI,
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": LEADERBOARD_PK_VALUE },
      ScanIndexForward: false, // highest totalSessions first
      Limit: LIMIT,
    }),
  );

  const entries: LeaderboardEntry[] = (Items ?? []).map((item, i) => ({
    rank: i + 1,
    handle: item.handle,
    totalSessions: item.totalSessions,
    currentStreak: item.currentStreak,
    bestStreak: item.bestStreak,
    isYou: item.userId === userId,
  }));

  return json(200, { entries });
};
