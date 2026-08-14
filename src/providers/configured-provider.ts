import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { AgentDiscoveryLeadProvider } from './agent-discovery-provider';
import { ApolloLeadProvider } from './apollo-provider';
import { OpenStreetMapLeadProvider } from './openstreetmap-provider';
import { PhotonLeadProvider } from './photon-provider';
import { DuckDuckGoLeadProvider, SearXNGLeadProvider, TavilyLeadProvider } from './web-search-provider';

/** Multi-source discovery with free fallbacks enabled by default. */
export function configuredLeadProviders(): LeadProvider[] {
  const providers: LeadProvider[] = [];

  const searxngUrl = process.env.SEARXNG_URL?.trim();
  if (searxngUrl) providers.push(new SearXNGLeadProvider(searxngUrl));

  const tavilyKey = process.env.TAVILY_API_KEY?.trim();
  if (tavilyKey) providers.push(new TavilyLeadProvider(tavilyKey));

  const genericEndpoint = process.env.LEAD_PROVIDER_ENDPOINT?.trim();
  if (genericEndpoint) providers.push(new ApiLeadProvider(genericEndpoint, process.env.LEAD_PROVIDER_API_KEY));

  const apolloKey = process.env.APOLLO_API_KEY?.trim();
  if (apolloKey && process.env.APOLLO_USE_PAID_SEARCH === 'true') {
    providers.push(new ApolloLeadProvider(apolloKey));
  }

  // Agent-powered local discovery is always available as a free fallback.
  providers.push(new AgentDiscoveryLeadProvider());
  providers.push(new DuckDuckGoLeadProvider());
  providers.push(new PhotonLeadProvider());
  providers.push(new OpenStreetMapLeadProvider());

  return providers;
}
