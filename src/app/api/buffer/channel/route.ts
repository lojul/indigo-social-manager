import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById } from '@/lib/db';

export const dynamic = 'force-dynamic';

const channelCache = new Map<string, { id: string; name: string; service: string }[]>();

async function fetchChannels(headers: Record<string, string>, orgId: string) {
  // Try with service field first; fall back to id+name only if schema doesn't support it
  for (const query of [
    `{ channels(input: { organizationId: "${orgId}" }) { id name service } }`,
    `{ channels(input: { organizationId: "${orgId}" }) { id name } }`,
  ]) {
    const res = await fetch('https://api.buffer.com/rpc', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    const channels = data?.data?.channels;
    if (channels && channels.length > 0) return channels;
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const cached = channelCache.get(session.user.id);
    if (cached) return NextResponse.json({ channels: cached });

    const user = await getUserById(session.user.id);
    const token = user?.buffer_api_token || process.env.BUFFER_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'No Buffer API token. Add yours in Settings.' },
        { status: 400 }
      );
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const orgRes = await fetch('https://api.buffer.com/rpc', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: `{ account { organizations { id } } }` }),
    });
    if (!orgRes.ok) throw new Error(`Buffer org fetch returned ${orgRes.status}`);
    const orgData = await orgRes.json();
    const orgId = orgData?.data?.account?.organizations?.[0]?.id;
    if (!orgId) throw new Error('No organization found in Buffer account');

    const channels = await fetchChannels(headers, orgId);
    if (!channels) throw new Error('No channels found in Buffer account');

    const result = channels.map((c: { id: string; name: string; service?: string }) => ({
      id: c.id,
      name: c.name,
      service: c.service ?? 'unknown',
    }));

    channelCache.set(session.user.id, result);
    return NextResponse.json({ channels: result });
  } catch (err) {
    console.error('GET /api/buffer/channel error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get Buffer channels' },
      { status: 500 }
    );
  }
}
