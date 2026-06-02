import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache the channel to avoid repeated API calls (cleared on server restart)
let cachedChannel: { id: string; name: string } | null = null;

export async function GET() {
  try {
    if (cachedChannel) {
      return NextResponse.json({ channel: cachedChannel });
    }

    const token = process.env.BUFFER_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BUFFER_API_TOKEN not configured' }, { status: 500 });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Step 1: Get organization ID
    const orgRes = await fetch('https://api.buffer.com/rpc', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `{ account { organizations { id } } }`,
      }),
    });

    if (!orgRes.ok) throw new Error(`Buffer org fetch returned ${orgRes.status}`);
    const orgData = await orgRes.json();
    const orgId = orgData?.data?.account?.organizations?.[0]?.id;
    if (!orgId) throw new Error('No organization found in Buffer account');

    // Step 2: Get channels for organization
    const chanRes = await fetch('https://api.buffer.com/rpc', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `{ channels(input: { organizationId: "${orgId}" }) { id name } }`,
      }),
    });

    if (!chanRes.ok) throw new Error(`Buffer channels fetch returned ${chanRes.status}`);
    const chanData = await chanRes.json();
    const channels = chanData?.data?.channels;
    if (!channels || channels.length === 0) throw new Error('No channels found');

    const channel = { id: channels[0].id, name: channels[0].name };
    cachedChannel = channel;

    return NextResponse.json({ channel });
  } catch (err) {
    console.error('GET /api/buffer/channel error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get Buffer channel' },
      { status: 500 }
    );
  }
}
