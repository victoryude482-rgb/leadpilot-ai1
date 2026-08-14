import { getQuality, type Quality } from './quality-badge';

export function filterByQuality<T extends { score?: number }>(items: T[], quality?: Quality) {
  if (!quality) return items;
  return items.filter(item => getQuality(item.score) === quality);
}

export function qualityCounts<T extends { score?: number }>(items: T[]) {
  return items.reduce((counts, item) => {
    counts[getQuality(item.score)] += 1;
    return counts;
  }, { GOOD: 0, MEDIUM: 0, BAD: 0 } as Record<Quality, number>);
}
