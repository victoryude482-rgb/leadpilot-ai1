import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) return new NextResponse(challenge ?? '', { status: 200 });
  return NextResponse.json({ error: 'verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  // Meta webhook adapter. Outbound sending is enabled only after official credentials are configured.
  return NextResponse.json({ ok: true, received: true, configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) });
}
