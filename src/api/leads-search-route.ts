import { handleLeadFinder, type AuthContext } from './lead-finder-handler';
import type { LeadProvider } from '../providers/lead-provider';

export interface HttpRequest {
  method: string;
  body?: unknown;
}

export async function postLeadsSearch(
  request: HttpRequest,
  auth: AuthContext | null,
  providers: LeadProvider[],
) {
  if (request.method.toUpperCase() !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const result = await handleLeadFinder(auth, {
    industry: typeof body.industry === 'string' ? body.industry : undefined,
    country: typeof body.country === 'string' ? body.country : undefined,
    city: typeof body.city === 'string' ? body.city : undefined,
    keywords: typeof body.keywords === 'string' ? body.keywords : undefined,
    limit: typeof body.limit === 'number' ? body.limit : undefined,
  }, providers);

  return result;
}
