import { NextRequest, NextResponse } from 'next/server';
import { getCompanySearches, saveCompanySearch, removeCompanySearch } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const searches = await getCompanySearches(id);
  return NextResponse.json({ searches });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: 'query is required' }, { status: 400 });
  const searches = await saveCompanySearch(id, query.trim());
  return NextResponse.json({ searches });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: 'query is required' }, { status: 400 });
  const searches = await removeCompanySearch(id, query.trim());
  return NextResponse.json({ searches });
}
