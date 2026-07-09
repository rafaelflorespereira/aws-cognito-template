import { referenceAuth } from "@aws-amplify/backend";

/**
 * Bring-your-own Cognito: this app already has a user pool + hosted UI managed
 * outside Amplify (see packages/auth). `referenceAuth` points the Amplify
 * backend at that existing pool instead of creating a new one, so AppSync (the
 * Data API below) trusts the same JWTs your app already issues.
 *
 * Provide these values via the Amplify CLI environment (a `.env` in this
 * `amplify/` folder, or your CI secrets) before deploying. They come from your
 * AWS console:
 *   - COGNITO_USER_POOL_ID          Cognito > User pools > (pool) > Pool ID
 *   - COGNITO_USER_POOL_CLIENT_ID   the app client id (EXPO_PUBLIC_USER_POOL_CLIENT_ID)
 *   - COGNITO_IDENTITY_POOL_ID      Cognito > Identity pools > (pool) > Identity pool ID
 *   - COGNITO_AUTH_ROLE_ARN         the identity pool's authenticated IAM role ARN
 *   - COGNITO_UNAUTH_ROLE_ARN       the identity pool's unauthenticated IAM role ARN
 *
 * NOTE: `referenceAuth` requires an *identity pool* + auth/unauth roles. Your
 * current setup is user-pool only, so create an identity pool linked to the
 * existing user pool once (Cognito console > Identity pools > Create), then fill
 * in the two role ARNs it generates.
 */
export const auth = referenceAuth({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  userPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID!,
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID!,
  authRoleArn: process.env.COGNITO_AUTH_ROLE_ARN!,
  unauthRoleArn: process.env.COGNITO_UNAUTH_ROLE_ARN!,
});
