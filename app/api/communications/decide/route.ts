import { NextRequest, NextResponse } from 'next/server';
import { decideClientReply } from '../../../../src/communications/agent';
import type { CommunicationMessage } from '../../../../src/communications/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.text || typeof body.text !== 'string') return NextResponse.json({ error: 'text is required' }, { status: 400 });
    const message: CommunicationMessage = {
      id: String(body.id ?? crypto.randomUUID()),
      channel: body.channel ?? 'web',
      conversationId: String(body.conversationId ?? 'default'),
      direction: 'inbound',
      text: body.text,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json(decideClientReply(message, Array.isArray(body.context) ? body.context : []));
  } catch {
    return NextResponse.json({ error: 'Invalid communication request' }, { status: 400 });
  }
}
