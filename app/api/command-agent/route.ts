import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../src/auth/supabase-server';
import { runCommand } from '../../../src/agents/command-agent';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const command = typeof body.command === 'string' ? body.command.trim() : '';
  if (!command) return NextResponse.json({ error: 'Describe what you want the agent to do.' }, { status: 400 });
  const user = await getSupabaseAuthenticatedUser(request);
  const result = await runCommand(user ? { accountId: user.id } : null, command, {
    location: typeof body.location === 'string' ? body.location : undefined,
    city: typeof body.city === 'string' ? body.city : undefined,
    country: typeof body.country === 'string' ? body.country : undefined,
    industry: typeof body.industry === 'string' ? body.industry : undefined,
    limit: typeof body.limit === 'number' ? body.limit : 10,
  });
  return NextResponse.json(result);
}
