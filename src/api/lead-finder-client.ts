export interface LeadFinderFilters {
  industry?: string;
  country?: string;
  city?: string;
  keywords?: string;
  limit?: number;
}

export async function searchLeadFinder(filters: LeadFinderFilters) {
  const response = await fetch('/api/leads/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(filters),
  });

  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body
      ? String((body as { error: unknown }).error)
      : `Lead search failed (${response.status})`;
    throw new Error(message);
  }
  return body;
}
