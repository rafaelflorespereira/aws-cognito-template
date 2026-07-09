import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Data model mirrors src/features/vs/types.ts. Every model is owner-scoped:
 * `allow.owner()` means a signed-in user can only read/write their OWN rows,
 * keyed automatically by their Cognito `sub`. Data lives in DynamoDB behind an
 * AppSync GraphQL API.
 *
 * One row per user for settings/progress, many for records/reports.
 */
const schema = a.schema({
  // Single row per user (their configuration).
  UserSettings: a
    .model({
      timesPerDay: a.integer().required(),
      firstTime: a.string().required(), // "HH:mm"
      lastTime: a.string().required(), // "HH:mm"
      sessionDurationSec: a.integer().required(),
      notificationsEnabled: a.boolean().required(),
      showGuidedSteps: a.boolean().required(),
      configured: a.boolean().required(),
    })
    .authorization((allow) => [allow.owner()]),

  // One row per user per day.
  DailyProgress: a
    .model({
      date: a.date().required(), // "YYYY-MM-DD"
      completed: a.integer().required(),
      completedSlots: a.string().array(), // "HH:mm" per completed session
      lastCompletedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // Append-only log of completed sessions (drives stats/streaks).
  SessionRecord: a
    .model({
      date: a.date().required(), // "YYYY-MM-DD"
      slot: a.string().required(), // "HH:mm"
      completedAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.owner()]),

  // Optional post-session self-report.
  SessionReport: a
    .model({
      slot: a.string().required(),
      completedAt: a.datetime().required(),
      chakrasActive: a.string().array(),
      chakrasBlocked: a.string().array(),
      wellbeing: a.integer().required(), // 1..5
      perceptions: a.string().array(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // Use the referenced Cognito user pool from ./auth/resource.ts.
    defaultAuthorizationMode: "userPool",
  },
});
