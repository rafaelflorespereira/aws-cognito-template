'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Amplify automatically handles the authorization code exchange when this
 * page mounts (it reads the `?code=` query param from the URL). Once done,
 * tokens are stored and we redirect to the home page.
 */
export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Give Amplify a tick to process the OAuth callback, then redirect.
    const timer = setTimeout(() => router.replace('/'), 300);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#64748b',
        fontFamily: 'sans-serif',
      }}
    >
      <p>Signing you in...</p>
    </main>
  );
}
