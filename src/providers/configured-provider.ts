import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { ApolloLeadProvider } from './apollo-provider';
import { OpenStreetMapLeadProvider } from './openstreetmap-provider';

/**
 * Keep the built-in public business finder as the default. Apollo's
 * mixed_companies/search endpoint is not available on Apollo Free plans,
 * even when a valid API key is configured. Apollo can be explicitly enabled
 * later with APOLLO_USE_PAID_SEARCH=true after upgrading the provider plan.
 */
export function configuredLeadProviders(): LeadProvider[] {
  const apolloKey = process.env.APOLLO_API_KEY?.trim();
  const usePaidApolloSearch = process.env.APOLLO_USE_PAID_SEARCH === 'true';

  if (apolloKey && usePaidApolloSearch) {
    return [new ApolloLeadProvider(apolloKey), new OpenStreetMapLeadProvider()];
  }

  const endpoint = process.env.LEAD_PROVIDER_ENDPOINT;
  const apiKey = process.env.LEAD_PROVIDER_API_KEY;
  if (endpoint) return [new ApiLeadProvider(endpoint, apiKey)];

  return [new OpenStreetMapLeadProvider()];
}
