import { ApiLeadProvider, type LeadProvider } from './lead-provider';
import { ApolloLeadProvider } from './apollo-provider';
import { OpenStreetMapLeadProvider } from './openstreetmap-provider';
import { PhotonLeadProvider } from './photon-provider';
import { DuckDuckGoLeadProvider, SearXNGLeadProvider, TavilyLeadProvider } from './web-search-provider';

/** Real-business discovery providers. Web search is opt-in because article pages are not business leads. */
export function configuredLeadProviders(): LeadProvider[] {
  const providers: LeadProvider[] = [];
  const webDiscoveryEnabled = process.env.LEAD_WEB_DISCOVERY === 'true';
  const searxngUrl = process.env.SEARXNG_URL?.trim();
  const tavilyKey = process.env.TAVILY_API_KEY?.trim();

  if (webDiscoveryEnabled && searxngUrl) providers.push(new SearXNGLeadProvider(searxngUrl));
  if (webDiscoveryEnabled && tavilyKey) providers.push(new TavilyLeadProvider(tavilyKey));

  const genericEndpoint = process.env.LEAD_PROVIDER_ENDPOINT?.trim();
  if (genericEndpoint) providers.push(new ApiLeadProvider(genericEndpoint, process.env.LEAD_PROVIDER_API_KEY));

  const apolloKey = process.env.APOLLO_API_KEY?.trim();
  if (apolloKey && process.env.APOLLO_USE_PAID_SEARCH === 'true') providers.push(new ApolloLeadProvider(apolloKey));

  // Free sources that return actual business/place records. OSM uses real
  // category tags; the older name-regex discovery adapter is intentionally gone.
  providers.push(new PhotonLeadProvider());
  providers.push(new OpenStreetMapLeadProvider());

  if (webDiscoveryEnabled) providers.push(new DuckDuckGoLeadProvider());
  return providers;
}
