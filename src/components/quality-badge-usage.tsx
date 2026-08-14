import QualityBadge, { getQuality } from './quality-badge';
import './quality.css';

export function QualityBadgeUsage({ score }: { score?: number }) {
  const quality = getQuality(score);
  return <QualityBadge score={score} data-quality={quality} />;
}
