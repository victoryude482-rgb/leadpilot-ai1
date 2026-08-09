import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { ApolloLeadProvider } from './apollo-provider';
import { OpenStreetMapLeadProvider } from './openstreetmap-provider';

/**
 * Use Apollo when its server-side API key is configured, while keeping the
 * free OpenStreetMap provider as a fallback. This makes real lead discovery
 * work even when OSM has sparse coverage for a particular country or industry.
 */
export function configuredLeadProviders(): LeadProvider[] {
  const apolloKey = process.env.APOLLO_API_KEY?.trim();
  if (apolloKey) {
    return [new ApolloLeadProvider(apolloKey), new OpenStreetMapLeadProvider()];
  }

  const endpoint = process.env.LEAD_PROVIDER_ENDPOINT;
  const apiKey = process.env.LEAD_PROVIDER_API_KEY;
  if (endpoint) return [new ApiLeadProvider(endpoint, apiKey)];

  return [new OpenStreetMapLeadProvider()];
}
