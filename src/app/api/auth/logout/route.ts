import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return res;
}
