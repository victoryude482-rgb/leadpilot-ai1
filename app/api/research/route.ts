import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../src/auth/supabase-server';
import { researchWeb } from '../../../src/research/web-research';

export async function POST(request: Request) {
  const user = await getSupabaseAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) return NextResponse.json({ error: 'Enter a research question' }, { status: 400 });
  try { return NextResponse.json(await researchWeb(question)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Research failed' }, { status: 502 }); }
}
