export interface ProviderConfig {
  name: string;
  endpoint: string;
  apiKeyEnv?: string;
  enabled: boolean;
}

export function loadProviderConfig(env: Record<string, string | undefined>): ProviderConfig[] {
  const endpoint = env.LEAD_PROVIDER_ENDPOINT;
  if (!endpoint) return [];
  return [{
    name: env.LEAD_PROVIDER_NAME ?? 'configured-provider',
    endpoint,
    apiKeyEnv: 'LEAD_PROVIDER_API_KEY',
    enabled: env.LEAD_PROVIDER_ENABLED !== 'false',
  }];
}

export function assertSafeProviderEndpoint(endpoint: string): void {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('Lead provider endpoint must use HTTPS');
}
