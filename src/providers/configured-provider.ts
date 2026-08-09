import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { OpenStreetMapLeadProvider } from './openstreetmap-provider';

/**
 * LeadPilot's core search works without Apollo or another paid provider.
 * OpenStreetMap supplies real public business records; optional external
 * providers can still be enabled explicitly through LEAD_PROVIDER_ENDPOINT.
 */
export function configuredLeadProviders(): LeadProvider[] {
  const endpoint = process.env.LEAD_PROVIDER_ENDPOINT;
  const apiKey = process.env.LEAD_PROVIDER_API_KEY;
  if (endpoint) return [new ApiLeadProvider(endpoint, apiKey)];

  return [new OpenStreetMapLeadProvider()];
}
