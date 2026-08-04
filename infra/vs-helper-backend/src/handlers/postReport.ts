import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { Chakra, SessionReport } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_NOTES_LENGTH = 2000;
const MAX_LIST_LENGTH = 20;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  let report: SessionReport;
  try {
    report = parseBody(event.body);
  } catch (err) {
    return json(400, { message: (err as Error).message });
  }

  const sk = `REPORT#${report.completedAt}`;
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.reports,
        Item: { userId, sk, ...report },
        ConditionExpression: "attribute_not_exists(sk)",
      }),
    );
  } catch (err) {
    if (!(err instanceof ConditionalCheckFailedException)) throw err;
    // Same completedAt already synced (client retry) — idempotent no-op.
  }

  return json(201, { report });
};

function parseBody(body: string | undefined): SessionReport {
  if (!body) throw new Error("Missing request body");
  const parsed = JSON.parse(body);

  if (!TIME_RE.test(parsed.slot)) {
    throw new Error('Field "slot" must be "HH:mm"');
  }
  if (typeof parsed.completedAt !== "string" || !parsed.completedAt) {
    throw new Error('Field "completedAt" must be an ISO timestamp string');
  }
  const chakrasActive = parseStringArray(parsed.chakrasActive, "chakrasActive");
  const chakrasBlocked = parseStringArray(
    parsed.chakrasBlocked,
    "chakrasBlocked",
  );
  const perceptions = parseStringArray(parsed.perceptions, "perceptions");
  if (
    typeof parsed.wellbeing !== "number" ||
    !Number.isInteger(parsed.wellbeing) ||
    parsed.wellbeing < 1 ||
    parsed.wellbeing > 5
  ) {
    throw new Error('Field "wellbeing" must be an integer from 1 to 5');
  }
  let notes: string | undefined;
  if (parsed.notes !== undefined) {
    if (typeof parsed.notes !== "string") {
      throw new Error('Field "notes" must be a string');
    }
    if (parsed.notes.length > MAX_NOTES_LENGTH) {
      throw new Error(`Field "notes" must be at most ${MAX_NOTES_LENGTH} characters`);
    }
    notes = parsed.notes;
  }

  return {
    slot: parsed.slot,
    completedAt: parsed.completedAt,
    // The client's chakra picker is a closed set (ReportForm.tsx), but the
    // server only checks these are strings — an unrecognized id just won't
    // render anywhere, same tolerance as `perceptions`.
    chakrasActive: chakrasActive as Chakra[],
    chakrasBlocked: chakrasBlocked as Chakra[],
    wellbeing: parsed.wellbeing,
    perceptions,
    ...(notes !== undefined ? { notes } : {}),
  };
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) {
    throw new Error(
      `Field "${field}" must be an array of at most ${MAX_LIST_LENGTH} strings`,
    );
  }
  for (const v of value) {
    if (typeof v !== "string") {
      throw new Error(`Field "${field}" must be an array of strings`);
    }
  }
  return value;
}
