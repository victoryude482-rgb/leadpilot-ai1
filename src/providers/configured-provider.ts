import { ApiLeadProvider, type LeadProvider } from './lead-provider';

/**
 * Builds providers from server-only environment variables.
 * No provider is enabled unless an endpoint is explicitly configured.
 */
export function configuredLeadProviders(): LeadProvider[] {
  const endpoint = process.env.LEAD_PROVIDER_ENDPOINT;
  const apiKey = process.env.LEAD_PROVIDER_API_KEY;
  if (!endpoint) return [];
  return [new ApiLeadProvider(endpoint, apiKey)];
}
