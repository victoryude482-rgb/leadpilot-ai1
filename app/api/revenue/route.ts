import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../src/auth/supabase-server';
import { getRevenueEvents, recordRevenueEvent } from '../../../src/agents/revenue-store';
import { calculateFunnel } from '../../../src/agents/revenue';

export async function GET(request: Request) {
  const user = await getSupabaseAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to view revenue analytics.' }, { status: 401 });
  const rows = await getRevenueEvents(user.id);
  const events = rows.map((r: any) => ({ leadId: r.lead_id ?? undefined, event: r.event, value: Number(r.value || 0), currency: r.currency, occurredAt: r.occurred_at }));
  return NextResponse.json({ events, funnel: calculateFunnel(events) });
}

export async function POST(request: Request) {
  const user = await getSupabaseAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to record revenue events.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const allowed = ['qualified','draft_created','contacted','replied','meeting_booked','won','lost'];
  if (!allowed.includes(body.event)) return NextResponse.json({ error: 'Invalid revenue event.' }, { status: 400 });
  const row = await recordRevenueEvent(user.id, { leadId: body.leadId, event: body.event, value: Number(body.value || 0), currency: body.currency || 'USD', occurredAt: body.occurredAt || new Date().toISOString() });
  return NextResponse.json({ event: row }, { status: 201 });
}
