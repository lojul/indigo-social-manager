import { NextRequest, NextResponse } from 'next/server';
import { getBillingStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const months = parseInt(req.nextUrl.searchParams.get('months') ?? '3', 10);
    const stats = await getBillingStats(Math.min(Math.max(months, 1), 12));
    return NextResponse.json(stats);
  } catch (err) {
    console.error('GET /api/billing:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch billing stats' },
      { status: 500 },
    );
  }
}
