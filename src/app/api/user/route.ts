import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById, updateUserBufferToken } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    plan: user.plan ?? 'free',
    hasBufferToken: !!user.buffer_api_token,
    postsThisMonth: user.posts_this_month ?? 0,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bufferToken } = await req.json();
  if (typeof bufferToken !== 'string') {
    return NextResponse.json({ error: 'bufferToken is required' }, { status: 400 });
  }

  await updateUserBufferToken(session.user.id, bufferToken.trim());
  return NextResponse.json({ success: true });
}
