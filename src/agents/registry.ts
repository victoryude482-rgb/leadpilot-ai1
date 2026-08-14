import type { AgentDefinition, AgentName } from '../../docs/agent-contract';

export const AGENTS: AgentDefinition[] = [
  { id: 'lead-finder', name: 'AI Lead Finder', description: 'Find, normalize, deduplicate and rank legitimate business leads from multiple sources.', category: 'research', status: 'live', capabilities: ['natural-language search', 'multi-source discovery', 'deduplication', 'lead scoring'] },
  { id: 'trend-finder', name: 'AI Trend Finder', description: 'Discover emerging topics, markets, products and business signals.', category: 'research', status: 'beta', capabilities: ['trend discovery', 'signal analysis', 'source tracking'] },
  { id: 'opportunity-finder', name: 'AI Opportunity Finder', description: 'Turn a service or business idea into actionable market opportunities.', category: 'research', status: 'beta', capabilities: ['opportunity discovery', 'need signals', 'evidence summaries'] },
  { id: 'tender-finder', name: 'AI Tender Finder', description: 'Find relevant public tenders, contracts and procurement opportunities.', category: 'research', status: 'beta', capabilities: ['tender discovery', 'deadline tracking', 'eligibility extraction'] },
  { id: 'competitor-monitor', name: 'AI Competitor Monitor', description: 'Monitor public competitor changes and turn them into useful alerts.', category: 'monitoring', status: 'beta', capabilities: ['website monitoring', 'change detection', 'alerts'] },
  { id: 'outreach', name: 'AI Outreach Agent', description: 'Create personalized, approval-first outreach drafts from verified lead evidence.', category: 'sales', status: 'beta', capabilities: ['personalization', 'email drafts', 'follow-up drafts'] },
  { id: 'ecommerce-opportunity', name: 'AI E-commerce Opportunity', description: 'Identify emerging product categories and underserved market opportunities.', category: 'research', status: 'planned', capabilities: ['market signals', 'product opportunities', 'competition analysis'] },
  { id: 'content', name: 'AI Business Content Agent', description: 'Generate practical business content and campaign ideas.', category: 'content', status: 'planned', capabilities: ['social content', 'blog ideas', 'content calendars'] },
  { id: 'command-agent', name: 'AI Command Agent', description: 'Describe the outcome you want in plain language and route it to the right agents, with optional multi-agent research chains.', category: 'research', status: 'live', capabilities: ['natural-language commands', 'intent routing', 'multi-agent chains', 'result summaries'] },
];

export function getAgent(id: AgentName): AgentDefinition | undefined { return AGENTS.find((agent) => agent.id === id); }
export function listAgents(): AgentDefinition[] { return AGENTS; }
