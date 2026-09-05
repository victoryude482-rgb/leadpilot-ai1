import type { LeadSearchQuery } from '../providers/lead-provider';

const COUNTRIES = ['Nigeria', 'United States', 'United Kingdom', 'Canada', 'Ghana', 'Kenya', 'South Africa', 'India', 'Australia', 'Germany', 'France'];
const INDUSTRIES: Array<[RegExp, string]> = [
  [/\b(salons?|barbers?|beauty|spa|hair)\b/i, 'Beauty & wellness'],
  [/\b(restaurant|cafe|coffee|bakery|bar|catering|food)\b/i, 'Food & hospitality'],
  [/\b(hotel|hostel|guest house)\b/i, 'Hospitality'],
  [/\b(clinic|dentist|pharmacy|medical|health)\b/i, 'Healthcare'],
  [/\b(lawyer|legal|attorney)\b/i, 'Legal services'],
  [/\b(real estate|property|estate agent)\b/i, 'Real estate'],
  [/\b(plumber|electrician|builder|construction|contractor)\b/i, 'Construction & trades'],
  [/\b(computer|laptop|electronics|software|technology|it)\b/i, 'Technology'],
  [/\b(shop|store|retail|fashion|grocery|supermarket)\b/i, 'Retail'],
];

function clean(value?: string) { return value?.replace(/\s+/g, ' ').trim() || undefined; }

/** Turns a conversational request into a provider-safe, location-aware business search. */
export function interpretLeadQuery(input: LeadSearchQuery): LeadSearchQuery {
  const raw = clean(input.keywords);
  const suppliedCity = clean(input.city);
  const suppliedCountry = clean(input.country);
  if (!raw) return { ...input, city: suppliedCity, country: suppliedCountry };

  const country = suppliedCountry || COUNTRIES.find((item) => new RegExp(`\\b${item.replace(/ /g, '\\s+')}\\b`, 'i').test(raw));
  const locationMatch = raw.match(/\b(?:in|near|around|at)\s+([A-Za-z][A-Za-z .'-]{1,60}?)(?=\s+(?:that|which|who|with|for|to|need|needs|without)\b|[,.!?]|$)/i);
  let city = suppliedCity;
  if (!city && locationMatch) {
    const candidate = locationMatch[1].trim().replace(new RegExp(`\\s+${(country || '').replace(/ /g, '\\s+')}$`, 'i'), '').trim();
    if (candidate && candidate.toLowerCase() !== country?.toLowerCase()) city = candidate;
  }
  const industry = clean(input.industry) || INDUSTRIES.find(([pattern]) => pattern.test(raw))?.[1];
  const keywords = clean(raw
    .replace(/\b(find|show|give|list|search|look for|i need|please|real|actual|business(?:es)?|compan(?:y|ies)|leads?|prospects?|customers?|that need(?:s)?|which need(?:s)?|who need(?:s)?|with weak online presence|without (?:a )?(?:website|site)|need(?:s)? (?:a )?(?:website|site))\b/gi, ' ')
    .replace(locationMatch?.[0] || '', ' ')
    .replace(country || '', ' ')
    .replace(/\s+/g, ' '));
  return { ...input, industry, country, city, keywords: keywords || industry || 'business' };
}
