'use client';

import { useEffect, useState } from 'react';
import { getAuthUser, type AuthUser } from '@/lib/auth';
import LoginButton from '@/components/auth/LoginButton';
import UserProfile from '@/components/auth/UserProfile';

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main style={styles.container}>
        <p style={styles.muted}>Loading...</p>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>AWS Cognito + Google SSO</h1>

        {user ? (
          <>
            <p style={styles.subtitle}>You are signed in.</p>
            <UserProfile user={user} />
          </>
        ) : (
          <>
            <p style={styles.subtitle}>Sign in to continue.</p>
            <LoginButton />
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
  } as React.CSSProperties,
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '2.5rem',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  subtitle: {
    color: '#64748b',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  muted: {
    color: '#94a3b8',
  } as React.CSSProperties,
};
