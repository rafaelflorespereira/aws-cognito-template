import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

// No admin actions in this pass (kicking members, deleting a group) — the
// owner leaving just removes their own membership like anyone else; the
// group persists. See docs/vs-helper-backend.md "Not done yet".
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);
  const groupId = event.pathParameters?.groupId;
  if (!groupId) return json(400, { message: "Missing groupId" });

  await ddb.send(
    new DeleteCommand({
      TableName: TABLES.groupMembers,
      Key: { groupId, userId },
    }),
  );

  return json(200, { groupId });
};
