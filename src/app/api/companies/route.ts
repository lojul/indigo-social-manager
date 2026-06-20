import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanies, createCompany } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getAllCompanies());
  } catch (err) {
    console.error('GET /api/companies:', err);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, tagline = '', theme = 'indigo', size = '', category = '', url = '', description = '', language = 'en' } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const company = await createCompany(
      { name: name.trim(), tagline: tagline.trim(), theme, size, category, url: url.trim(), description: description.trim(), language },
    );
    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    console.error('POST /api/companies:', err);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
