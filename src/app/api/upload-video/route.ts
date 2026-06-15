import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 });
    }

    const headers: Record<string, string> = {};
    if (videoUrl.startsWith('https://openrouter.ai/')) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const videoRes = await fetch(videoUrl, { headers });
    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video: ${videoRes.status}`);
    }

    const blob = await put(`reel-${Date.now()}.mp4`, videoRes.body!, {
      access: 'public',
      contentType: 'video/mp4',
    });

    return NextResponse.json({ blobUrl: blob.url });
  } catch (err) {
    console.error('POST /api/upload-video:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
