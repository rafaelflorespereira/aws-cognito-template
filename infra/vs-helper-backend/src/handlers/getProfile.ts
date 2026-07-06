import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { UserProfile } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

const DEFAULT_PROFILE: UserProfile = { handle: "", leaderboardOptIn: false };

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId } }),
  );

  if (!Item) return json(200, DEFAULT_PROFILE);

  const profile: UserProfile = {
    handle: Item.handle ?? "",
    leaderboardOptIn: !!Item.leaderboardOptIn,
  };
  return json(200, profile);
};
