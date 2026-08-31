import type { AgentRunInput } from './runtime';
import { selectDesign, buildHumanCopy, HUMAN_COPY_RULES } from './design-library';
import { humanize } from './collaboration';
import { runPythonAgent } from './python-worker';

type Block = {
  id: string;
  type: string;
  variant?: string;
  props: Record<string, unknown>;
};

export type SiteConfig = {
  name: string;
  designPattern: string;
  theme: {
    bg0: string;
    text0: string;
    accent: string;
    fontSans: string;
    fontDisplay: string;
    radius: number;
  };
  blocks: Block[];
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'business-site';
}

function inferIndustry(query: string): string {
  const value = query.toLowerCase();
  if (/restaurant|food|cafe|bar|hotel/.test(value)) return 'Hospitality';
  if (/real estate|property|realtor/.test(value)) return 'Professional Services';
  if (/plumb|hvac|roof|contractor|construction|cleaning/.test(value)) return 'Local Service';
  if (/agency|marketing|photograph|design|beauty|fashion/.test(value)) return 'Creative';
  if (/saas|software|app|ai|tech/.test(value)) return 'Software';
  return 'Business';
}

function buildSite(query: string, reasoning?: Record<string, unknown>): SiteConfig {
  const pattern = selectDesign(query);
  const copy = buildHumanCopy(query, pattern);
  const industry = inferIndustry(query);
  const pythonCopy = (reasoning?.copy as Record<string, unknown> | undefined) ?? {};
  const cta = typeof pythonCopy.cta === 'string' ? pythonCopy.cta : copy.cta;
  const headline = typeof pythonCopy.headline === 'string' ? pythonCopy.headline : copy.headline;
  const subheadline = typeof pythonCopy.subheadline === 'string' ? pythonCopy.subheadline : copy.subheadline;

  return {
    name: query || industry,
    designPattern: pattern.id,
    theme: {
      bg0: '#09090b',
      text0: '#fafafa',
      accent: '#7c5cff',
      fontSans: 'Inter',
      fontDisplay: 'Space Grotesk',
      radius: 12,
    },
    blocks: [
      {
        id: 'nav-1',
        type: 'navbar',
        variant: 'default',
        props: {
          logo: query || industry,
          links: pattern.sections.slice(1, 5).map((item: string) => item.replace(/-/g, ' ')),
          ctaText: cta,
        },
      },
      {
        id: 'hero-1',
        type: 'hero',
        variant: pattern.layout[0],
        props: {
          badge: pattern.personality.join(' · '),
          headline: humanize(headline),
          subheadline: humanize(subheadline),
          primaryCta: cta,
        },
      },
      {
        id: 'services-1',
        type: 'services',
        variant: 'adaptive',
        props: {
          title: 'How we can help',
          items: pattern.sections.slice(2, 5).map((section: string, index: number) => ({
            title: section.replace(/-/g, ' ').replace(/\b\w/g, (match: string) => match.toUpperCase()),
            description: [
              'Clear information about what you offer and who it is for.',
              'Useful details that help people decide without a hard sell.',
              'A straightforward next step when they are ready.',
            ][index],
          })),
        },
      },
      {
        id: 'about-1',
        type: 'about',
        variant: 'story',
        props: {
          title: 'A little more about us',
          description: `This section is intentionally written as a place for ${query || 'the business owner'} to add the real story, experience and details that matter to customers. No invented claims.`,
        },
      },
      {
        id: 'faq-1',
        type: 'faq',
        variant: 'simple',
        props: {
          title: 'Questions people usually ask',
          items: [
            { question: 'How do I get started?', answer: 'Tell us what you need and we will explain the next step.' },
            { question: 'Where can I find the details?', answer: 'Add your real contact, pricing, hours or service information here.' },
          ],
        },
      },
      {
        id: 'cta-1',
        type: 'cta',
        variant: 'centered',
        props: {
          title: 'Have a question?',
          description: 'Tell us what you need. We will make the next step clear.',
          buttonText: cta,
        },
      },
      {
        id: 'footer-1',
        type: 'footer',
        variant: 'minimal',
        props: { copyright: `${query || industry} · Built with LeadPilot AI` },
      },
    ],
  };
}

function svgLogo(name: string): string {
  const initials = (name || 'LP').slice(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="180" fill="#09090b"/><circle cx="512" cy="512" r="300" fill="#7c5cff"/><text x="512" y="570" text-anchor="middle" font-family="Arial,sans-serif" font-size="250" font-weight="700" fill="white">${initials}</text></svg>`;
}

async function generateLogo(name: string) {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) {
    return {
      status: 'fallback' as const,
      format: 'svg',
      svg: svgLogo(name),
      message: 'A local logo is ready. Add TOGETHER_API_KEY when you want generative logo concepts.',
    };
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: `Create a distinctive professional logo for ${name}. Simple vector-like icon, no mockup, no watermark.`,
        n: 1,
        width: 1024,
        height: 1024,
        response_format: 'url',
      }),
    });
    const data = await response.json() as { error?: { message?: string }; data?: Array<{ url?: string }> };
    if (!response.ok) throw new Error(data.error?.message || `Together API ${response.status}`);
    return { status: 'generated' as const, format: 'image', url: data.data?.[0]?.url, message: 'Logo generated with Together AI.' };
  } catch (error) {
    return {
      status: 'fallback' as const,
      format: 'svg',
      svg: svgLogo(name),
      message: `Logo generation failed safely: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }
}

export async function runWebsiteBrand(input: AgentRunInput) {
  const python = await runPythonAgent(input, { context: `Website and brand design request for ${input.query}` });
  const reasoning = python?.results?.[0] as Record<string, unknown> | undefined;
  const site = buildSite(input.query, reasoning);
  const logo = await generateLogo(site.name);
  const brandDirection = reasoning?.brandDirection as Record<string, unknown> | undefined;
  const designPattern = selectDesign(input.query);

  return {
    agent: 'website-brand',
    generatedAt: new Date().toISOString(),
    design: {
      pattern: site.designPattern,
      personality: Array.isArray(brandDirection?.personality) ? brandDirection.personality : designPattern.personality,
      layout: designPattern.layout,
      tone: typeof brandDirection?.tone === 'string' ? brandDirection.tone : designPattern.tone,
    },
    copyRules: HUMAN_COPY_RULES,
    results: [
      {
        id: `site-${slug(site.name)}`,
        name: site.name,
        title: `Website + brand kit for ${site.name}`,
        description: 'Industry-aware website structure with Python-driven brand reasoning and human-first copy.',
        websiteConfig: site,
        pythonReasoning: reasoning,
        logo,
        score: 92,
        lead: { score: 92, scoreLabel: 'GOOD', status: 'ready' },
        url: `/api/website-brand?query=${encodeURIComponent(input.query)}`,
      },
    ],
    warnings: [
      ...(python ? [] : ['Python reasoning unavailable; TypeScript design fallback used.']),
      ...(logo.status === 'fallback' ? [logo.message] : []),
    ],
    strategy: [
      'Python owns brand direction, copy, industry inference and information architecture.',
      'TypeScript owns website rendering, persistence, export and side effects.',
      'Unknown business facts are never invented.',
      'Logo generation remains in the TypeScript rendering layer with a safe local fallback.',
    ],
  };
}
