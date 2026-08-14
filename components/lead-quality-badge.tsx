'use client';

export type LeadQuality = 'good' | 'medium' | 'bad';

export function getLeadQuality(score?: number): LeadQuality {
  const value = Number(score ?? 0);
  if (value >= 70) return 'good';
  if (value >= 40) return 'medium';
  return 'bad';
}

export default function LeadQualityBadge({ score }: { score?: number }) {
  const quality = getLeadQuality(score);
  const styles = {
    good: { label: 'GOOD', background: '#123b2d', border: '#2e8b69', text: '#7ee7c4' },
    medium: { label: 'MEDIUM', background: '#3b3212', border: '#a68b2e', text: '#f0d76a' },
    bad: { label: 'BAD', background: '#3b171b', border: '#a84450', text: '#ff8993' },
  }[quality];

  return (
    <span
      title={`Lead quality: ${styles.label}${score == null ? '' : ` (${score}/100)`}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 9px',
        borderRadius: 999,
        background: styles.background,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '.08em',
      }}
    >
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: styles.text }} />
      {styles.label}
    </span>
  );
}
