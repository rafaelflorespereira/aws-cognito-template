import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.settings, Key: { userId } }),
  );

  if (!Item) return json(404, { message: "No synced settings for this user" });

  const { userId: _pk, ...settings } = Item;
  return json(200, settings);
};
