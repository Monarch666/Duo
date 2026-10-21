import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getRecentEventsSince } from '@/lib/realtime/bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await getCurrentAuth();

  if (!auth || !auth.couple) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get('since') || undefined;
  const events = getRecentEventsSince(auth.couple.coupleId, since);

  return NextResponse.json({
    success: true,
    events,
    timestamp: new Date().toISOString(),
  });
}
