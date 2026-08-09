export interface WebVerificationResult {
  status: 'VERIFIED' | 'UNAVAILABLE' | 'FAILED';
  finalUrl?: string;
  httpStatus?: number;
  checkedAt: string;
  evidence: string;
}

/**
 * Server-side adapter boundary for checking a supplied website.
 * Keep network access behind this interface so SSRF protection and allowlists
 * can be enforced by the HTTP implementation.
 */
export interface WebsiteVerifier {
  verify(url: string): Promise<WebVerificationResult>;
}

export function normalizeWebsiteUrl(value: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
