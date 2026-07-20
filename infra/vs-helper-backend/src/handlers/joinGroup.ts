import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Group } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";
import { MAX_GROUP_MEMBERS } from "../lib/groups";
import { HANDLE_RE } from "../lib/handle";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);
  const groupId = event.pathParameters?.groupId;
  if (!groupId) return json(400, { message: "Missing groupId" });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId } }),
  );
  if (!group) return json(404, { message: "Group not found" });

  const { Item: existingMember } = await ddb.send(
    new GetCommand({ TableName: TABLES.groupMembers, Key: { groupId, userId } }),
  );
  if (existingMember) {
    const result: Group = { groupId, name: group.name };
    return json(200, result);
  }

  const { Item: user } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId } }),
  );
  if (!user?.handle || !HANDLE_RE.test(user.handle)) {
    return json(400, {
      message:
        "Set a public handle in the Leaderboard tab before joining a group",
    });
  }

  const countResult = await ddb.send(
    new QueryCommand({
      TableName: TABLES.groupMembers,
      KeyConditionExpression: "groupId = :g",
      ExpressionAttributeValues: { ":g": groupId },
      Select: "COUNT",
    }),
  );
  if ((countResult.Count ?? 0) >= MAX_GROUP_MEMBERS) {
    return json(400, { message: "This group is full" });
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLES.groupMembers,
      Item: {
        groupId,
        userId,
        handle: user.handle,
        groupName: group.name,
        joinedAt: new Date().toISOString(),
      },
    }),
  );

  const result: Group = { groupId, name: group.name };
  return json(200, result);
};
