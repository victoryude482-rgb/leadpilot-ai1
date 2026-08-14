export interface OfferInput { qualified: boolean; optedOut?: boolean; amount: number; currency: string; }

export function canCreateOffer(input: OfferInput) {
  if (input.optedOut) return { allowed: false, reason: 'Lead opted out.' };
  if (!input.qualified) return { allowed: false, reason: 'Lead is not qualified.' };
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { allowed: false, reason: 'Invalid offer amount.' };
  if (!input.currency) return { allowed: false, reason: 'Currency is required.' };
  return { allowed: true, reason: 'Offer can be created.' };
}
