import { NextResponse } from 'next/server';
function clean(value: unknown, max = 300) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = clean(body.email, 254), name = clean(body.name, 120), offer = clean(body.offer, 160) || 'Victory AI Growth';
  const leadId = clean(body.leadId, 120), agentId = clean(body.agentId, 120), currency = (clean(body.currency, 8) || 'NGN').toUpperCase();
  const amount = Number(body.amount);
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: 'A valid offer amount is required.' }, { status: 400 });
  const origin = new URL(request.url).origin;
  const reference = `VA-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const response = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, amount: String(amount), currency, reference, callback_url: `${origin}/offer/success?reference=${encodeURIComponent(reference)}`, metadata: { customer_name: name, offer, lead_id: leadId, agent_id: agentId } }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.status) return NextResponse.json({ error: data.message || 'Unable to initialize payment.' }, { status: 502 });
  return NextResponse.json({ authorization_url: data.data?.authorization_url, access_code: data.data?.access_code, reference });
}
