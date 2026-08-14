import { NextResponse } from 'next/server';
import { listAgents } from '../../../src/agents/registry';

export async function GET() {
  return NextResponse.json({ agents: listAgents() });
}
