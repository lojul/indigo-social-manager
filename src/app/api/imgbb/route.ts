import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'image base64 is required' }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IMGBB_API_KEY not configured' }, { status: 500 });
    }

    const form = new URLSearchParams();
    form.append('key', apiKey);
    form.append('image', image);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!res.ok) {
      throw new Error(`imgbb returned ${res.status}`);
    }

    const data = await res.json();
    const url = data?.data?.url;
    if (!url) throw new Error('No URL in imgbb response');

    return NextResponse.json({ url });
  } catch (err) {
    console.error('POST /api/imgbb error:', err);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
