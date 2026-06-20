import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById, updateCompany } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const company = await getCompanyById(id);
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(company);
  } catch (err) {
    console.error('GET /api/companies/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await req.json();
    const allowed = ['name', 'tagline', 'theme', 'size', 'category', 'url', 'description', 'language'] as const;
    const fields: Record<string, string> = {};
    for (const key of allowed) {
      if (key in body && typeof body[key] === 'string') fields[key] = body[key].trim();
    }
    if (fields.name === '') return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
    const updated = await updateCompany(id, fields);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/companies/[id]:', err);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}
