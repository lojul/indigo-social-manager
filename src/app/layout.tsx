import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Indigo Admin',
  description: 'Internal tools portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
