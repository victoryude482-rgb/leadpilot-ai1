import { NextResponse } from 'next/server';
import { runDueAgentSchedules } from '../../../../src/agents/scheduler';

export async function POST(request: Request) {
  const expected = process.env.AGENT_CRON_SECRET;
  const supplied = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (expected && supplied !== expected) return NextResponse.json({ error: 'Unauthorized scheduler request.' }, { status: 401 });
  if (!expected && process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'AGENT_CRON_SECRET is required in production.' }, { status: 503 });
  try {
    const runs = await runDueAgentSchedules(10);
    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scheduler failed.' }, { status: 500 });
  }
}
