import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../../../src/auth/supabase-server';

export async function POST(request: Request) {
  const user = await getSupabaseAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to create a checkout.' }, { status: 401 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : user.email;
  const amount = Number(body.amount);
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'NGN';
  if (!email || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'A valid customer email and positive amount are required.' }, { status: 400 });
  const origin = new URL(request.url).origin;
  const reference = `victory_${user.id.slice(0,8)}_${Date.now()}`;
  const response = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, amount: Math.round(amount * 100), currency, reference, callback_url: `${origin}/payments/callback`, metadata: { user_id: user.id, lead_id: body.leadId || null, agent_id: body.agentId || null, offer: body.offer || null } }) });
  const data = await response.json();
  if (!response.ok || !data.status) return NextResponse.json({ error: data.message || 'Unable to initialize payment.' }, { status: 502 });
  return NextResponse.json({ authorizationUrl: data.data.authorization_url, accessCode: data.data.access_code, reference: data.data.reference });
}
