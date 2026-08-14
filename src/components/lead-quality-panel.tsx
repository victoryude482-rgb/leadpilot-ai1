'use client';

import QualityBadge from './quality-badge';
import './quality.css';

export default function LeadQualityPanel({ score }: { score?: number }) {
  const value = Math.max(0, Math.min(100, Number(score ?? 0)));
  return <div className="lead-quality-panel">
    <QualityBadge score={value} />
    <span className="lead-quality-score">{value}/100</span>
  </div>;
}
