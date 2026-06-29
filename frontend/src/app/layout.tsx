import type { Metadata } from 'next';
import '@/lib/amplify'; // configure Amplify once at the module level
import './globals.css';

export const metadata: Metadata = {
  title: 'AWS Cognito + Google SSO',
  description: 'Authentication template with AWS Cognito and Google SSO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
