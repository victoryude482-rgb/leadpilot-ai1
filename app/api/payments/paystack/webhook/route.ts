import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { recordRevenueEvent } from '../../../../../src/agents/revenue-store';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 500 });
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  const payload = JSON.parse(raw);
  if (payload.event !== 'charge.success') return NextResponse.json({ received: true });
  const data = payload.data || {};
  const metadata = data.metadata || {};
  const userId = metadata.userId;
  if (!userId) return NextResponse.json({ received: true, ignored: 'missing userId' });
  await recordRevenueEvent(userId, { leadId: metadata.leadId, agentId: metadata.agentId, event: 'won', value: Number(data.amount || 0) / 100, currency: data.currency || 'NGN', occurredAt: data.paid_at || new Date().toISOString() });
  return NextResponse.json({ received: true });
}
