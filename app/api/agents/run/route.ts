import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../../src/auth/supabase-server';
import { runAgent } from '../../../../src/agents/runtime';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = await getSupabaseAuthenticatedUser(request);
  const agent = typeof body.agent === 'string' ? body.agent : 'lead-finder';
  const query = typeof body.query === 'string' ? body.query.trim() : '';

  if (!query) return NextResponse.json({ error: 'Enter what you want the agent to find.' }, { status: 400 });

  const result = await runAgent(user ? { accountId: user.id } : null, {
    agent,
    query,
    location: typeof body.location === 'string' ? body.location : undefined,
    city: typeof body.city === 'string' ? body.city : undefined,
    country: typeof body.country === 'string' ? body.country : undefined,
    industry: typeof body.industry === 'string' ? body.industry : undefined,
    limit: typeof body.limit === 'number' ? body.limit : 10,
  });

  // Lead-finder returns an HTTP-style { body, status } response, while
  // evidence agents return their result object directly. Handle both shapes
  // so the route stays type-safe and the browser receives readable results.
  if ('body' in result && 'status' in result) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json(result);
}
