import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

/**
 * Typed AppSync/DynamoDB client. Use it only after `configureAmplify()` has run
 * and the user is signed in (models are owner-scoped). Example:
 *
 *   import { dataClient } from "@/features/vs/remote";
 *   const { data } = await dataClient.models.SessionRecord.create({
 *     date, slot, completedAt,
 *   });
 */
export const dataClient = generateClient<Schema>();
