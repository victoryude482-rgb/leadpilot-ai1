import { NextRequest, NextResponse } from 'next/server';
import { orchestrate } from '../../../src/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.request || typeof body.request !== 'string') {
      return NextResponse.json({ error: 'request is required' }, { status: 400 });
    }
    const result = await orchestrate({
      request: body.request,
      mode: body.mode,
      approvalRequired: body.approvalRequired,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Orchestration failed' }, { status: 500 });
  }
}
