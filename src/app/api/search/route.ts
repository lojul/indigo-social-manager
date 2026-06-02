import { NextRequest, NextResponse } from 'next/server';
import { getCachedSearch, setCachedSearch } from '@/lib/db';

export const dynamic = 'force-dynamic';

function cleanContent(raw: string): string {
  const text = raw
    .replace(/!\[.*?\]\(.*?\)/g, '')           // markdown images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // [text](url) → text
    .replace(/#{1,6}\s*/g, '')                 // headings
    .replace(/\*{1,2}([^*]*)\*{1,2}/g, '$1')  // bold/italic
    .replace(/`[^`]*`/g, '')                   // inline code
    .replace(/^\s*[*\-•]\s+/gm, ' ')           // list bullets
    .replace(/\.{2,}/g, '')                    // dot sequences (nav menus)
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Split into sentences and keep only substantive ones
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 40 &&
        !/^(see more|newsletter|subscribe|sign up|cookie|privacy|terms|all rights|copyright|\w+ sets this cookie)/i.test(s)
    );

  const result = sentences.join(' ');
  return (result.length > 30 ? result : text).slice(0, 240);
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const normalised = query.trim();

    const cached = await getCachedSearch(normalised);
    if (cached) {
      return NextResponse.json({ results: cached, fromCache: true });
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: normalised,
        topic: 'news',
        max_results: 6,
        search_depth: 'basic',
      }),
    });

    if (!res.ok) throw new Error(`Tavily returned ${res.status}`);

    const data = await res.json();
    const results = (data.results || [])
      .map((r: { title?: string; content?: string }) => ({
        title: r.title?.trim() || '',
        summary: r.content ? cleanContent(r.content) : '',
      }))
      .filter(
        (r: { title: string; summary: string }) =>
          r.title.length > 0 && r.summary.length > 30
      )
      .slice(0, 5);

    await setCachedSearch(normalised, results);

    return NextResponse.json({ results });
  } catch (err) {
    console.error('POST /api/search:', err);
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
  }
}
