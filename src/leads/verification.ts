import type { BusinessRecord } from './model';

export type VerificationStatus = 'VERIFIED' | 'PRESENT' | 'MISSING' | 'UNAVAILABLE';

export interface VerificationCheck {
  type: 'business_name' | 'website' | 'phone' | 'email' | 'location' | 'source';
  status: VerificationStatus;
  evidence: string;
}

export function verifyBusiness(business: BusinessRecord): VerificationCheck[] {
  return [
    {
      type: 'business_name',
      status: business.name.trim() ? 'PRESENT' : 'MISSING',
      evidence: business.name.trim() ? 'Business name supplied by source.' : 'No business name supplied.',
    },
    {
      type: 'website',
      status: business.website ? 'PRESENT' : 'MISSING',
      evidence: business.website ? 'Website URL supplied by source; reachability should be checked by an external verifier.' : 'No website supplied.',
    },
    {
      type: 'phone',
      status: business.phone ? 'PRESENT' : 'MISSING',
      evidence: business.phone ? 'Phone number supplied by source; ownership is not inferred.' : 'No phone supplied.',
    },
    {
      type: 'email',
      status: business.email ? 'PRESENT' : 'MISSING',
      evidence: business.email ? 'Email supplied by source; mailbox validity is not inferred.' : 'No email supplied.',
    },
    {
      type: 'location',
      status: business.city || business.country ? 'PRESENT' : 'MISSING',
      evidence: business.city || business.country ? 'Location information supplied by source.' : 'No location supplied.',
    },
    {
      type: 'source',
      status: business.source ? 'PRESENT' : 'MISSING',
      evidence: business.source ? `Lead source: ${business.source}` : 'No source supplied.',
    },
  ];
}
