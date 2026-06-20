import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let channelCache: { id: string; name: string; service: string }[] | null = null;

async function fetchChannels(headers: Record<string, string>, orgId: string) {
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
  try {
    if (channelCache) return NextResponse.json({ channels: channelCache });

    const token = process.env.BUFFER_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'BUFFER_API_TOKEN not configured.' },
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

    channelCache = result;
    return NextResponse.json({ channels: result });
  } catch (err) {
    console.error('GET /api/buffer/channel error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get Buffer channels' },
      { status: 500 }
    );
  }
}
