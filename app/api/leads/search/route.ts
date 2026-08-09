import { NextResponse } from 'next/server';
import { postLeadsSearch } from '../../../../src/api/leads-search-route';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // Authentication/provider wiring is supplied by the application runtime.
  // Keep this route adapter explicit so credentials never enter the client bundle.
  const authHeader = request.headers.get('x-account-id');
  const result = await postLeadsSearch(
    { method: 'POST', body },
    authHeader ? { accountId: authHeader } : null,
    [],
  );
  return NextResponse.json(result.body, { status: result.status });
}
