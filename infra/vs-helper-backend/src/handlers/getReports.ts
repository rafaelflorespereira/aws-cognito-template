import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { SessionReport } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);
  const reports: SessionReport[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await ddb.send(
      new QueryCommand({
        TableName: TABLES.reports,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ExclusiveStartKey,
      }),
    );
    for (const item of page.Items ?? []) {
      reports.push({
        slot: item.slot,
        completedAt: item.completedAt,
        chakrasActive: item.chakrasActive ?? [],
        chakrasBlocked: item.chakrasBlocked ?? [],
        wellbeing: item.wellbeing,
        perceptions: item.perceptions ?? [],
        notes: item.notes,
      });
    }
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  reports.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  return json(200, { reports });
};
