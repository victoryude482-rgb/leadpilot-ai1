import type { ImportResult, ImportedLeadRow } from './model';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return v ? v : undefined;
}

export function normalizeRow(input: Record<string, unknown>): ImportedLeadRow | null {
  const name = clean(input.name ?? input.business_name ?? input.business);
  if (!name) return null;

  const email = clean(input.email);
  if (email && !EMAIL.test(email)) return null;

  return {
    name,
    website: clean(input.website),
    phone: clean(input.phone),
    email,
    address: clean(input.address),
    city: clean(input.city),
    country: clean(input.country),
    industry: clean(input.industry),
  };
}

export function duplicateKey(row: ImportedLeadRow): string {
  return [row.name, row.city, row.country]
    .map((v) => (v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
    .join('|');
}

export function importRows(rows: Array<Record<string, unknown>>): {
  records: ImportedLeadRow[];
  result: ImportResult;
} {
  const seen = new Set<string>();
  const records: ImportedLeadRow[] = [];
  const errors: ImportResult['errors'] = [];
  let duplicates = 0;
  let rejected = 0;

  rows.forEach((raw, index) => {
    const row = normalizeRow(raw);
    if (!row) {
      rejected += 1;
      errors.push({ row: index + 1, reason: 'Missing business name or invalid email' });
      return;
    }

    const key = duplicateKey(row);
    if (seen.has(key)) {
      duplicates += 1;
      return;
    }

    seen.add(key);
    records.push(row);
  });

  return {
    records,
    result: {
      imported: rows.length,
      valid: records.length,
      duplicates,
      rejected,
      errors,
    },
  };
}
