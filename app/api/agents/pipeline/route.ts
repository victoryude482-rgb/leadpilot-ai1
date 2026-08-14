import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../../src/auth/supabase-server';
import { buildSalesPipeline } from '../../../../src/agents/sales-pipeline';

export async function POST(request: Request) {
  const user = await getSupabaseAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to qualify leads and create outreach drafts.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const lead = body.lead && typeof body.lead === 'object' ? body.lead : {};
  const offer = typeof body.offer === 'string' ? body.offer.trim() : '';
  if (!offer) return NextResponse.json({ error: 'Enter the offer or service you want to sell.' }, { status: 400 });
  const result = buildSalesPipeline({ ...lead, offer });
  return NextResponse.json(result);
}
