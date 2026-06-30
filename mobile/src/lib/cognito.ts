import * as AuthSession from "expo-auth-session";

const region = process.env.EXPO_PUBLIC_AWS_REGION;
const domainPrefix = process.env.EXPO_PUBLIC_COGNITO_DOMAIN;
const clientId = process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID ?? "";
const scheme = "myapp";

const baseUrl = `https://${domainPrefix}.auth.${region}.amazoncognito.com`;

export const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `${baseUrl}/oauth2/authorize`,
  tokenEndpoint: `${baseUrl}/oauth2/token`,
  revocationEndpoint: `${baseUrl}/oauth2/revoke`,
};

export const cognitoConfig = {
  clientId,
  scopes: ["openid", "email", "profile"],
};

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
