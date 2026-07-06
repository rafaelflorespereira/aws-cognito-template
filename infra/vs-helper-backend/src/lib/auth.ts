import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

// The HTTP API JWT authorizer (lib/vs-helper-backend-stack.ts) already verified
// the token's signature, issuer and audience before the handler ever runs; the
// `sub` claim is the Cognito user id and is the partition key for every table.
// Handlers must never trust a client-supplied user id instead.
export function requireUserId(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): string {
  const sub = event.requestContext.authorizer.jwt.claims.sub;
  if (typeof sub !== "string" || !sub) {
    throw new Error("Missing sub claim on authorized request");
  }
  return sub;
}
