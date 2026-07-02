import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { cognitoConfig, getDiscovery, getRedirectUri } from "./cognito";

const KEYS = {
  idToken: "auth.id_token",
  accessToken: "auth.access_token",
  refreshToken: "auth.refresh_token",
};

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string | null;
}

export interface AuthUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<AuthTokens> {
  const redirectUri = getRedirectUri();
  const discovery = await getDiscovery();
  const result = await AuthSession.exchangeCodeAsync(
    {
      clientId: cognitoConfig.clientId,
      code,
      redirectUri,
      extraParams: { code_verifier: codeVerifier },
    },
    discovery,
  );

  const tokens: AuthTokens = {
    idToken: result.idToken!,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? null,
  };

  await saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthTokens | null> {
  try {
    const discovery = await getDiscovery();
    const result = await AuthSession.refreshAsync(
      { clientId: cognitoConfig.clientId, refreshToken },
      discovery,
    );
    const tokens: AuthTokens = {
      idToken: result.idToken!,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? refreshToken,
    };
    await saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const [idToken, accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.idToken),
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
  ]);

  if (!idToken || !accessToken) return null;
  return { idToken, accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)),
  );
}

export function parseIdToken(idToken: string): AuthUser {
  const payload = idToken.split(".")[1];
  const decoded = JSON.parse(atob(payload));
  return {
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
}

async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.idToken, tokens.idToken),
    SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
    tokens.refreshToken
      ? SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken)
      : Promise.resolve(),
  ]);
}
