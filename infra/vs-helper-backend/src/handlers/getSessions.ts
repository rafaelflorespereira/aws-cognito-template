import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { SessionRecord } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);
  const records: SessionRecord[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await ddb.send(
      new QueryCommand({
        TableName: TABLES.sessions,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ExclusiveStartKey,
      }),
    );
    for (const item of page.Items ?? []) {
      records.push({
        date: item.date,
        slot: item.slot,
        completedAt: item.completedAt,
      });
    }
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  records.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  return json(200, { records });
};
