import {
  fetchAuthSession,
  getCurrentUser,
  signOut as amplifySignOut,
  signInWithRedirect,
} from 'aws-amplify/auth';

export interface AuthUser {
  username: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    const payload = idToken?.payload ?? {};

    return {
      username: user.username,
      email: (payload['email'] as string) ?? '',
      name: payload['name'] as string | undefined,
      picture: payload['picture'] as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function signInWithGoogle() {
  await signInWithRedirect({ provider: 'Google' });
}

export async function signOut() {
  await amplifySignOut();
}
