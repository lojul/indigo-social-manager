import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllCompanies, createCompany, countUserCompanies, getUserById } from '@/lib/db';

export const dynamic = 'force-dynamic';

const FREE_COMPANY_LIMIT = 1;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await getAllCompanies(session.user.id));
  } catch (err) {
    console.error('GET /api/companies:', err);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const user = await getUserById(session.user.id);
    if ((user?.plan ?? 'free') === 'free') {
      const count = await countUserCompanies(session.user.id);
      if (count >= FREE_COMPANY_LIMIT) {
        return NextResponse.json(
          { error: 'Free plan allows 1 workspace. Upgrade to Pro for unlimited.', upgrade: true },
          { status: 403 },
        );
      }
    }
    const body = await req.json();
    const { name, tagline = '', theme = 'indigo', size = '', category = '', url = '', description = '', language = 'en' } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const company = await createCompany(
      { name: name.trim(), tagline: tagline.trim(), theme, size, category, url: url.trim(), description: description.trim(), language },
      session.user.id,
    );
    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    console.error('POST /api/companies:', err);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
