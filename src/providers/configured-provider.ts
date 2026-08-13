import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { ApolloLeadProvider } from './apollo-provider';
import { OpenStreetMapLeadProvider } from './openstreetmap-provider';
import { SearXNGLeadProvider, TavilyLeadProvider } from './web-search-provider';

/**
 * Multi-source discovery. Providers are independent: one failure is isolated by
 * search-service.ts, so no single data source can take down lead discovery.
 *
 * Optional environment variables:
 * SEARXNG_URL       self-hosted SearXNG /search endpoint
 * TAVILY_API_KEY    optional Tavily key
 * LEAD_PROVIDER_ENDPOINT / LEAD_PROVIDER_API_KEY  generic adapter (maps scraper,
 * Overture proxy, or another licensed service)
 * APOLLO_API_KEY + APOLLO_USE_PAID_SEARCH=true  optional Apollo adapter
 */
export function configuredLeadProviders(): LeadProvider[] {
  const providers: LeadProvider[] = [];

  const searxngUrl = process.env.SEARXNG_URL?.trim();
  if (searxngUrl) providers.push(new SearXNGLeadProvider(searxngUrl));

  const tavilyKey = process.env.TAVILY_API_KEY?.trim();
  if (tavilyKey) providers.push(new TavilyLeadProvider(tavilyKey));

  const genericEndpoint = process.env.LEAD_PROVIDER_ENDPOINT?.trim();
  if (genericEndpoint) {
    providers.push(new ApiLeadProvider(genericEndpoint, process.env.LEAD_PROVIDER_API_KEY));
  }

  const apolloKey = process.env.APOLLO_API_KEY?.trim();
  if (apolloKey && process.env.APOLLO_USE_PAID_SEARCH === 'true') {
    providers.push(new ApolloLeadProvider(apolloKey));
  }

  // Keep OSM as a fallback only; it is never the sole source when other sources
  // are configured, and a 400/429 from it is isolated by Promise.allSettled.
  providers.push(new OpenStreetMapLeadProvider());

  return providers;
}
