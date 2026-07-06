import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { VSSettings } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";

// Synced settings carry a client-set `updatedAt` so concurrent devices resolve
// via last-write-wins (docs/vs-helper-architecture.md §12.4) instead of a stale
// write clobbering a newer one.
type SyncedSettings = VSSettings & { updatedAt: string };

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  let incoming: SyncedSettings;
  try {
    incoming = parseBody(event.body);
  } catch (err) {
    return json(400, { message: (err as Error).message });
  }

  const { Item: existing } = await ddb.send(
    new GetCommand({ TableName: TABLES.settings, Key: { userId } }),
  );

  if (existing && String(existing.updatedAt) > incoming.updatedAt) {
    // A newer write already landed; tell the caller what actually won.
    const { userId: _pk, ...settings } = existing;
    return json(200, settings);
  }

  const item = { userId, ...incoming };
  await ddb.send(new PutCommand({ TableName: TABLES.settings, Item: item }));

  const { userId: _pk, ...settings } = item;
  return json(200, settings);
};

function parseBody(body: string | undefined): SyncedSettings {
  if (!body) throw new Error("Missing request body");
  const parsed = JSON.parse(body);

  const requiredNumbers = ["timesPerDay", "sessionDurationSec"] as const;
  const requiredStrings = ["firstTime", "lastTime", "updatedAt"] as const;
  const requiredBooleans = [
    "notificationsEnabled",
    "showGuidedSteps",
    "configured",
  ] as const;

  for (const key of requiredNumbers) {
    if (typeof parsed[key] !== "number") {
      throw new Error(`Field "${key}" must be a number`);
    }
  }
  for (const key of requiredStrings) {
    if (typeof parsed[key] !== "string" || !parsed[key]) {
      throw new Error(`Field "${key}" must be a non-empty string`);
    }
  }
  for (const key of requiredBooleans) {
    if (typeof parsed[key] !== "boolean") {
      throw new Error(`Field "${key}" must be a boolean`);
    }
  }

  return {
    timesPerDay: parsed.timesPerDay,
    firstTime: parsed.firstTime,
    lastTime: parsed.lastTime,
    sessionDurationSec: parsed.sessionDurationSec,
    notificationsEnabled: parsed.notificationsEnabled,
    showGuidedSteps: parsed.showGuidedSteps,
    configured: parsed.configured,
    updatedAt: parsed.updatedAt,
  };
}
