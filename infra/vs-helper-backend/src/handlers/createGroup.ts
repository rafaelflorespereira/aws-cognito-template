import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { Group } from "@vs/shared";
import { ddb, TABLES } from "../lib/ddb";
import { requireUserId } from "../lib/auth";
import { json } from "../lib/http";
import { generateGroupId, MAX_GROUP_NAME_LENGTH } from "../lib/groups";
import { HANDLE_RE } from "../lib/handle";

const MAX_ID_ATTEMPTS = 5;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = requireUserId(event);

  let name: string;
  try {
    name = parseBody(event.body);
  } catch (err) {
    return json(400, { message: (err as Error).message });
  }

  const { Item: user } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId } }),
  );
  if (!user?.handle || !HANDLE_RE.test(user.handle)) {
    return json(400, {
      message:
        "Set a public handle in the Leaderboard tab before creating a group",
    });
  }

  let groupId = "";
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const candidate = generateGroupId();
    const { Item: existing } = await ddb.send(
      new GetCommand({ TableName: TABLES.groups, Key: { groupId: candidate } }),
    );
    if (!existing) {
      groupId = candidate;
      break;
    }
  }
  if (!groupId) {
    return json(500, { message: "Could not generate a unique group code" });
  }

  const now = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: TABLES.groups,
      Item: { groupId, name, ownerId: userId, createdAt: now },
    }),
  );

  // Creator auto-joins as the first member.
  await ddb.send(
    new PutCommand({
      TableName: TABLES.groupMembers,
      Item: {
        groupId,
        userId,
        handle: user.handle,
        groupName: name,
        joinedAt: now,
      },
    }),
  );

  const group: Group = { groupId, name };
  return json(200, group);
};

function parseBody(body: string | undefined): string {
  if (!body) throw new Error("Missing request body");
  const parsed = JSON.parse(body);
  if (typeof parsed.name !== "string" || !parsed.name.trim()) {
    throw new Error('Field "name" must be a non-empty string');
  }
  const name = parsed.name.trim();
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    throw new Error(
      `Field "name" must be ${MAX_GROUP_NAME_LENGTH} characters or fewer`,
    );
  }
  return name;
}
