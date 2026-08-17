export interface LeadFinderFilters {
  industry?: string;
  country?: string;
  city?: string;
  keywords?: string;
  limit?: number;
}

async function postSearch(path: string, filters: LeadFinderFilters) {
  const response = await fetch(path, {
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

export function searchLeadFinder(filters: LeadFinderFilters) {
  return postSearch('/api/leads/search', filters);
}

export function searchTrendLeads(filters: LeadFinderFilters) {
  return postSearch('/api/leads/trend-search', filters);
}
