import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function postToChannel(
  channelId: string,
  service: string,
  text: string,
  imageUrl: string | undefined,
  token: string,
  videoUrl?: string,
) {
  const isReel = !!videoUrl;
  const assets = videoUrl
    ? [{ video: { url: videoUrl } }]
    : imageUrl ? [{ image: { url: imageUrl } }] : [];

  const metadata: Record<string, unknown> = {};
  if (service === 'facebook') metadata.facebook = { type: isReel ? 'reel' : 'post' };
  if (service === 'instagram') metadata.instagram = { type: isReel ? 'reel' : 'post', shouldShareToFeed: true };

  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post { id status }
        }
        ... on InvalidInputError { message }
        ... on UnexpectedError { message }
        ... on LimitReachedError { message }
        ... on RestProxyError { message link code }
      }
    }
  `;

  const res = await fetch('https://api.buffer.com/rpc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          channelId,
          text,
          schedulingType: 'automatic',
          mode: 'addToQueue',
          assets,
          metadata,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Buffer ${res.status} (${service}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message || 'Buffer GraphQL error');

  const result = data?.data?.createPost;
  if (!result) throw new Error(`No createPost result (${service})`);
  if (result.message) throw new Error(`${result.message}${result.code ? ` [code: ${result.code}]` : ''}${result.link ? ` — ${result.link}` : ''}`);
  if (!result.post?.id) throw new Error(`Post not queued (${service}): ${JSON.stringify(result)}`);

  return { channelId, service, success: true };
}

export async function POST(req: NextRequest) {
  try {
    const { channelIds, text, imageUrl, videoUrl } = await req.json();

    if (!channelIds || channelIds.length === 0) {
      return NextResponse.json({ error: 'channelIds is required' }, { status: 400 });
    }

    const token = process.env.BUFFER_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BUFFER_API_TOKEN not configured' }, { status: 500 });
    }

    // Post to all channels in parallel (filter out any malformed entries)
    const validChannels = channelIds.filter((c: { id?: string }) => c?.id);
    if (validChannels.length === 0) {
      return NextResponse.json({ error: 'No valid channel IDs provided' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      validChannels.map(({ id, service }: { id: string; service: string }) =>
        postToChannel(id, service ?? 'unknown', text, imageUrl, token, videoUrl)
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

    if (succeeded === 0) {
      throw new Error(`All posts failed: ${errors.join('; ')}`);
    }

    return NextResponse.json({
      success: true,
      posted: succeeded,
      total: validChannels.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('POST /api/buffer/post error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to post to Buffer' },
      { status: 500 }
    );
  }
}
