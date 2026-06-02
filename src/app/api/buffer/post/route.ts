import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { channelId, text, imageUrl } = await req.json();

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      );
    }

    const token = process.env.BUFFER_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BUFFER_API_TOKEN not configured' }, { status: 500 });
    }

    const assets = imageUrl ? [{ image: { url: imageUrl } }] : [];

    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post {
              id
              status
            }
          }
          ... on InvalidInputError { message }
          ... on UnexpectedError { message }
          ... on LimitReachedError { message }
          ... on RestProxyError { message }
        }
      }
    `;

    const variables = {
      input: {
        channelId,
        text,
        schedulingType: 'automatic',
        mode: 'addToQueue',
        assets,
        metadata: { facebook: { type: 'post' } },
      },
    };

    const res = await fetch('https://api.buffer.com/rpc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!res.ok) throw new Error(`Buffer returned ${res.status}`);

    const data = await res.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Buffer mutation error');
    }

    const result = data?.data?.createPost;
    if (result?.message) {
      throw new Error(result.message);
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('POST /api/buffer/post error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to post to Buffer' },
      { status: 500 }
    );
  }
}
