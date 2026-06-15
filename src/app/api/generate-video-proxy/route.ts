import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('https://openrouter.ai/')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 502 });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return NextResponse.json({ error: `Upstream ${res.status}: ${body.slice(0, 200)}` }, { status: res.status });
  }

  const isDownload = req.nextUrl.searchParams.get('download') === '1';
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'video/mp4',
      'Content-Disposition': isDownload ? 'attachment; filename="reel.mp4"' : 'inline',
      'Cache-Control': 'no-store',
    },
  });
}
