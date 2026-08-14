'use client';

export type Quality = 'GOOD' | 'MEDIUM' | 'BAD';

export function getQuality(score?: number): Quality {
  const value = Number(score ?? 0);
  if (value >= 70) return 'GOOD';
  if (value >= 40) return 'MEDIUM';
  return 'BAD';
}

export default function QualityBadge({ score }: { score?: number }) {
  const quality = getQuality(score);
  return <span className={`quality-badge quality-${quality.toLowerCase()}`} aria-label={`Lead quality: ${quality}`}>
    <i aria-hidden="true" /> {quality}
  </span>;
}
