import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = 'zh-TW' } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Translate API returned ${res.status}`);

    const result = await res.json();
    const translated = (result[0] as Array<[string]>).map((p) => p[0]).join('');

    return NextResponse.json({ translated });
  } catch (err) {
    console.error('POST /api/translate error:', err);
    return NextResponse.json({ error: 'Translation failed', translated: '' }, { status: 500 });
  }
}
