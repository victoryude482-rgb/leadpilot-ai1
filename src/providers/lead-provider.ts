export interface LeadSearchQuery {
  industry?: string;
  country?: string;
  city?: string;
  keywords?: string;
  limit?: number;
}

export interface DiscoveredBusiness {
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  source: string;
}

export interface LeadProvider {
  search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]>;
}

/** Provider boundary: external sources can be plugged in without changing scoring/CRM code. */
export class ApiLeadProvider implements LeadProvider {
  constructor(private readonly endpoint: string, private readonly apiKey?: string) {}

  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(query),
    });
    if (!response.ok) throw new Error(`Lead provider failed: ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Lead provider returned an invalid response');

    return data.filter((item): item is DiscoveredBusiness =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { name?: unknown }).name === 'string',
    ).map((item) => ({
      ...item,
      source: typeof (item as { source?: unknown }).source === 'string'
        ? (item as { source: string }).source
        : this.endpoint,
    }));
  }
}
