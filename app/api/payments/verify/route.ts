import { NextResponse } from 'next/server';
import { recordRevenueEvent } from '../../../../src/agents/revenue-store';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  const userId = url.searchParams.get('userId');
  if (!reference || !userId) return NextResponse.json({ error: 'Missing payment reference or user.' }, { status: 400 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY is not configured.' }, { status: 500 });
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload?.status) return NextResponse.json({ error: payload?.message || 'Unable to verify payment.' }, { status: 502 });
  const payment = payload.data;
  if (payment.status !== 'success') return NextResponse.json({ paid: false, status: payment.status, reference }, { status: 200 });
  const metadata = typeof payment.metadata === 'object' ? payment.metadata : {};
  await recordRevenueEvent(userId, { leadId: metadata.leadId, agentId: metadata.agentId, event: 'won', value: Number(payment.amount || 0) / 100, currency: payment.currency || 'NGN', occurredAt: payment.paid_at || new Date().toISOString() });
  return NextResponse.json({ paid: true, reference, amount: payment.amount, currency: payment.currency, status: payment.status });
}
