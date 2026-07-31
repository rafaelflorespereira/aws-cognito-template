import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

// The HTTP API JWT authorizer (lib/vs-helper-backend-stack.ts) already verified
// the token's signature, issuer and audience before the handler ever runs.
// Handlers must never trust a client-supplied user id instead.
//
// We key every table by `email` rather than `sub` so that the same person is
// recognised as a single user regardless of which social IDP they sign in with
// (e.g. Google vs Apple). Cognito always includes the email in the ID token
// when the `email` scope is requested (see packages/auth/src/cognito.ts).
export function requireUserId(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): string {
  const email = event.requestContext.authorizer.jwt.claims.email;
  if (typeof email !== "string" || !email) {
    throw new Error("Missing email claim on authorized request");
  }
  return email;
}
