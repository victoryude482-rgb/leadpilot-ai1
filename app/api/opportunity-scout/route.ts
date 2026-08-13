import { NextResponse } from 'next/server';

const SOURCES = [
  'https://news.google.com/rss/search?q=business+trends+AI+automation+OR+small+business+OR+local+services&hl=en-US&gl=US&ceid=US:en',
  'https://www.reddit.com/r/smallbusiness/.rss',
  'https://www.reddit.com/r/Entrepreneur/.rss',
];

type Opportunity = {
  niche: string;
  score: number;
  signal: string;
  why: string;
  sourceCount: number;
};

function extractTitles(xml: string) {
  return [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gis)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 30);
}

function score(title: string) {
  const t = title.toLowerCase();
  let points = 50;
  if (/ai|automation|agent/.test(t)) points += 15;
  if (/growth|demand|sales|marketing|revenue/.test(t)) points += 10;
  if (/local|small business|contractor|agency|clinic|dental|solar|real estate/.test(t)) points += 10;
  if (/trend|rising|surge|growing|boom|record/.test(t)) points += 10;
  return Math.min(points, 95);
}

function nicheFromTitle(title: string) {
  const t = title.toLowerCase();
  if (/solar|energy/.test(t)) return 'Solar & energy services';
  if (/contractor|roof|plumb|hvac|construction/.test(t)) return 'Home & contractor services';
  if (/dental|dentist|clinic|health/.test(t)) return 'Local healthcare services';
  if (/real estate|realtor|property/.test(t)) return 'Real-estate services';
  if (/ai|automation|agent/.test(t)) return 'AI automation for businesses';
  if (/marketing|advertis/.test(t)) return 'Local marketing services';
  return 'Emerging local business opportunity';
}

export async function GET() {
  const responses = await Promise.allSettled(
    SOURCES.map((url) => fetch(url, { next: { revalidate: 1800 }, headers: { 'User-Agent': 'LeadPilot Opportunity Scout/1.0' } }))
  );
  const titles: string[] = [];
  for (const result of responses) {
    if (result.status !== 'fulfilled' || !result.value.ok) continue;
    titles.push(...extractTitles(await result.value.text()));
  }

  const grouped = new Map<string, { score: number; signals: string[]; count: number }>();
  for (const title of titles) {
    const niche = nicheFromTitle(title);
    const current = grouped.get(niche) ?? { score: 0, signals: [], count: 0 };
    current.score = Math.max(current.score, score(title));
    current.count += 1;
    if (current.signals.length < 2) current.signals.push(title);
    grouped.set(niche, current);
  }

  const opportunities: Opportunity[] = [...grouped.entries()]
    .map(([niche, data]) => ({
      niche,
      score: Math.min(99, data.score + Math.min(data.count * 2, 8)),
      signal: data.signals[0] ?? 'Multiple public market signals detected',
      why: `${data.count} public signals detected across the monitored sources.`,
      sourceCount: data.count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return NextResponse.json({ generatedAt: new Date().toISOString(), opportunities });
}
