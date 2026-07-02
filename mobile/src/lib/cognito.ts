import * as AuthSession from "expo-auth-session";

/**
 * These map 1:1 to the "OIDC properties" on the Cognito console page
 * "Add the example code to your application" (step 5):
 *
 *   issuer      -> EXPO_PUBLIC_COGNITO_ISSUER
 *   clientID    -> EXPO_PUBLIC_USER_POOL_CLIENT_ID
 *   redirectURI -> resolved automatically from the app scheme (getRedirectUri)
 *   logoutURL   -> EXPO_PUBLIC_LOGOUT_URI (optional)
 *
 * The hosted-UI (managed login) authorize / token / revoke endpoints are
 * discovered from the issuer, so you never hardcode the domain prefix.
 */
export const issuer = process.env.EXPO_PUBLIC_COGNITO_ISSUER ?? "";
const clientId = process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID ?? "";
const scheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "myapp";

export const cognitoConfig = {
  clientId,
  scopes: ["openid", "email", "profile"],
  logoutUri: process.env.EXPO_PUBLIC_LOGOUT_URI ?? "",
};

// Cached discovery for the non-hook code paths (token exchange / refresh).
// Components should use AuthSession.useAutoDiscovery(issuer) instead.
let discoveryPromise: Promise<AuthSession.DiscoveryDocument> | null = null;
export function getDiscovery(): Promise<AuthSession.DiscoveryDocument> {
  if (!discoveryPromise) {
    discoveryPromise = AuthSession.fetchDiscoveryAsync(issuer);
  }
  return discoveryPromise;
}

// makeRedirectUri resolves to:
//  - Expo Go (simulator): exp://localhost:8081
//  - Expo Go (device):    exp://<local-ip>:8081
//  - Standalone build:    myapp://callback
export function getRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme,
    path: "callback",
  });
}
