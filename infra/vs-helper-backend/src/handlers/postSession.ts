import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  computeStats,
  type LifetimeStats,
  type SessionRecord,
  type UserProfile,
} from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";
import { buildStatsItem } from "../lib/leaderboard";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  let record: SessionRecord;
  let goalPerDay: number;
  try {
    ({ record, goalPerDay } = parseBody(event.body));
  } catch (err) {
    return json(400, { message: (err as Error).message });
  }

  const sk = `SESSION#${record.completedAt}`;
  let alreadyRecorded = false;
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.sessions,
        Item: { userId, sk, ...record },
        ConditionExpression: "attribute_not_exists(sk)",
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      // Same completedAt already synced (client retry) — idempotent no-op.
      alreadyRecorded = true;
    } else {
      throw err;
    }
  }

  const stats = alreadyRecorded
    ? await readStats(userId)
    : await recomputeStats(userId, goalPerDay);

  return json(alreadyRecorded ? 200 : 201, { session: record, stats });
};

async function recomputeStats(userId: string, goalPerDay: number) {
  const [history, profile] = await Promise.all([
    queryAllSessions(userId),
    readProfile(userId),
  ]);
  const stats = computeStats(history, goalPerDay);
  await ddb.send(
    new PutCommand({
      TableName: TABLES.stats,
      Item: buildStatsItem(userId, stats, profile),
    }),
  );
  return stats;
}

async function readProfile(userId: string): Promise<UserProfile | null> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId } }),
  );
  if (!Item) return null;
  return { handle: Item.handle ?? "", leaderboardOptIn: !!Item.leaderboardOptIn };
}

const ZERO_STATS: LifetimeStats = {
  totalSessions: 0,
  daysActive: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: "",
};

async function readStats(userId: string): Promise<LifetimeStats> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.stats, Key: { userId } }),
  );
  if (!Item) return ZERO_STATS;
  const { userId: _pk, ...stats } = Item;
  return stats as LifetimeStats;
}

async function queryAllSessions(userId: string): Promise<SessionRecord[]> {
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
  return records;
}

function parseBody(body: string | undefined): {
  record: SessionRecord;
  goalPerDay: number;
} {
  if (!body) throw new Error("Missing request body");
  const parsed = JSON.parse(body);

  if (!DATE_RE.test(parsed.date)) {
    throw new Error('Field "date" must be "YYYY-MM-DD"');
  }
  if (!TIME_RE.test(parsed.slot)) {
    throw new Error('Field "slot" must be "HH:mm"');
  }
  if (typeof parsed.completedAt !== "string" || !parsed.completedAt) {
    throw new Error('Field "completedAt" must be an ISO timestamp string');
  }
  if (
    typeof parsed.goalPerDay !== "number" ||
    !Number.isFinite(parsed.goalPerDay) ||
    parsed.goalPerDay <= 0
  ) {
    throw new Error('Field "goalPerDay" must be a positive number');
  }

  return {
    record: {
      date: parsed.date,
      slot: parsed.slot,
      completedAt: parsed.completedAt,
    },
    goalPerDay: parsed.goalPerDay,
  };
}
