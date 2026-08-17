import { NextResponse } from 'next/server';
import { postTrendLeadsSearch } from '../../../../src/api/trend-lead-route';
import { getSupabaseAuthenticatedUser } from '../../../../src/auth/supabase-server';
import { configuredLeadProviders } from '../../../../src/providers/configured-provider';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = await getSupabaseAuthenticatedUser(request);
  const result = await postTrendLeadsSearch(
    { method: 'POST', body },
    user ? { accountId: user.id } : null,
    configuredLeadProviders(),
  );
  return NextResponse.json(result.body, { status: result.status });
}
