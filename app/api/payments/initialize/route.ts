import { NextResponse } from 'next/server';
import { verifyOfferToken } from '../../../../src/agents/offer-link';

function clean(value: unknown, max = 300) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });

  const contentType = request.headers.get('content-type') || '';
  let body: Record<string, unknown> = {};
  if (contentType.includes('application/json')) body = await request.json().catch(() => ({}));
  else body = Object.fromEntries((await request.formData()).entries());

  const email = clean(body.email, 254);
  const name = clean(body.name, 120);
  const token = clean(body.offerToken, 4000);
  const verified = token ? verifyOfferToken(token) : null;
  if (!verified) return NextResponse.json({ error: 'This offer link is invalid or expired.' }, { status: 400 });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });

  // Never trust amount/currency/lead/agent values supplied by the browser.
  const amount = Number(verified.amount);
  const currency = clean(verified.currency, 8).toUpperCase();
  const offer = clean(verified.offer, 160);
  const leadId = clean(verified.leadId, 120);
  const agentId = clean(verified.agentId, 120);
  if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: 'This offer has an invalid amount.' }, { status: 400 });

  const origin = new URL(request.url).origin;
  const reference = `VA-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount: String(amount), currency, reference, callback_url: `${origin}/offer/success?reference=${encodeURIComponent(reference)}`, metadata: { customer_name: name, offer, lead_id: leadId, agent_id: agentId } })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.status) return NextResponse.json({ error: data.message || 'Unable to initialize payment.' }, { status: 502 });
  return NextResponse.json({ authorization_url: data.data?.authorization_url, access_code: data.data?.access_code, reference });
}
