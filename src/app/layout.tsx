import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/auth';
import { getUserById } from '@/lib/db';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Soshio',
  description: 'AI-powered social media posting for growing businesses',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userProfile = session?.user?.id ? await getUserById(session.user.id) : null;

  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        <SessionProvider session={session}>
          {session?.user && (
            <Navbar user={{ ...session.user, plan: userProfile?.plan ?? 'free' }} />
          )}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
