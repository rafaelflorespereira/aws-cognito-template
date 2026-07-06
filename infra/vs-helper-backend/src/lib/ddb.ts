import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client);

export const TABLES = {
  settings: process.env.SETTINGS_TABLE_NAME!,
  sessions: process.env.SESSIONS_TABLE_NAME!,
  stats: process.env.STATS_TABLE_NAME!,
  users: process.env.USERS_TABLE_NAME!,
};
