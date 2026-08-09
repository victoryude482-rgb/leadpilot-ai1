import { NextResponse } from 'next/server';
import { postLeadsSearch } from '../../../../src/api/leads-search-route';
import { getSupabaseAuthenticatedUser } from '../../../../src/auth/supabase-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = await getSupabaseAuthenticatedUser(request);
  const result = await postLeadsSearch(
    { method: 'POST', body },
    user ? { accountId: user.id } : null,
    [],
  );
  return NextResponse.json(result.body, { status: result.status });
}
