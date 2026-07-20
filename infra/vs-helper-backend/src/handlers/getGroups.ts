import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Group } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  const { Items } = await ddb.send(
    new QueryCommand({
      TableName: TABLES.groupMembers,
      IndexName: "byUser",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    }),
  );

  // `name` is read from the denormalized `groupName` set at join time,
  // avoiding a second read per group — see src/handlers/joinGroup.ts.
  const groups: Group[] = (Items ?? []).map((item) => ({
    groupId: item.groupId,
    name: item.groupName,
  }));

  return json(200, { groups });
};
