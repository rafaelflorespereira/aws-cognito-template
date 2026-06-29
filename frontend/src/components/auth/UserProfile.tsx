'use client';

import { signOut, type AuthUser } from '@/lib/auth';
import Image from 'next/image';

interface Props {
  user: AuthUser;
}

export default function UserProfile({ user }: Props) {
  return (
    <div style={styles.container}>
      {user.picture && (
        <Image
          src={user.picture}
          alt={user.name ?? user.email}
          width={64}
          height={64}
          style={styles.avatar}
        />
      )}
      <div style={styles.info}>
        {user.name && <p style={styles.name}>{user.name}</p>}
        <p style={styles.email}>{user.email}</p>
      </div>
      <button onClick={signOut} style={styles.signOutBtn}>
        Sign out
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  avatar: {
    borderRadius: '50%',
    objectFit: 'cover',
  } as React.CSSProperties,
  info: {
    textAlign: 'center',
  } as React.CSSProperties,
  name: {
    fontWeight: 600,
    fontSize: '1rem',
    marginBottom: '4px',
  } as React.CSSProperties,
  email: {
    color: '#64748b',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  signOutBtn: {
    marginTop: '8px',
    padding: '8px 20px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#ef4444',
    fontWeight: 500,
  } as React.CSSProperties,
};
