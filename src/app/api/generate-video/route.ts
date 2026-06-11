import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OR_BASE = 'https://openrouter.ai/api/v1';

// POST: submit video generation job
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, aspectRatio = '9:16' } = await req.json();

    if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });

    const res = await fetch(`${OR_BASE}/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-imagine-video',
        prompt,
        duration: 5,
        aspect_ratio: aspectRatio,
        resolution: '720p',
        frame_images: [
          {
            type: 'image_url',
            image_url: { url: imageUrl },
            frame_type: 'first_frame',
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    return NextResponse.json({ jobId: data.id, status: data.status });
  } catch (err) {
    console.error('POST /api/generate-video:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Video generation failed' },
      { status: 500 },
    );
  }
}

// GET: poll job status
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });

    const res = await fetch(`${OR_BASE}/videos/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenRouter poll ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return NextResponse.json({
      status: data.status,
      videoUrl: data.status === 'completed' ? (data.unsigned_urls?.[0] ?? null) : null,
      cost: data.usage?.cost ?? null,
    });
  } catch (err) {
    console.error('GET /api/generate-video:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Poll failed' },
      { status: 500 },
    );
  }
}
