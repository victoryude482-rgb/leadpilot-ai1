import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { ApolloLeadProvider } from './apollo-provider';

/**
 * Builds providers from server-only environment variables.
 * Apollo is preferred when APOLLO_API_KEY is configured; the generic provider
 * remains available for other integrations.
 */
export function configuredLeadProviders(): LeadProvider[] {
  const apolloKey = process.env.APOLLO_API_KEY;
  if (apolloKey) return [new ApolloLeadProvider(apolloKey)];

  const endpoint = process.env.LEAD_PROVIDER_ENDPOINT;
  const apiKey = process.env.LEAD_PROVIDER_API_KEY;
  if (!endpoint) return [];
  return [new ApiLeadProvider(endpoint, apiKey)];
}
