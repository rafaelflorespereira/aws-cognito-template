import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { LifetimeStats } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

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

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.stats, Key: { userId } }),
  );

  if (!Item) return json(200, ZERO_STATS);

  const { userId: _pk, ...stats } = Item;
  return json(200, stats);
};
