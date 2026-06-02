import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Social Media Manager',
  description: 'Multi-company social media posting tool for Indigo Tech Foundry',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
