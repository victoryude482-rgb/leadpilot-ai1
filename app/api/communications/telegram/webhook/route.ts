import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Telegram webhook adapter: provider-specific delivery belongs here.
  // This endpoint intentionally does not send messages until a bot token is configured.
  const update = await request.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, received: true, configured: Boolean(process.env.TELEGRAM_BOT_TOKEN) });
}
