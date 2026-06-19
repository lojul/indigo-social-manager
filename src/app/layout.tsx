import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Indigo Admin',
  description: 'Internal admin portal for Indigo Tech Foundry',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        <SessionProvider session={session}>
          {session?.user && <Navbar user={session.user} />}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
