export type DecisionLevel = 'autonomous' | 'approval-required' | 'user-only';

export type DecisionItem = {
  area: string;
  level: DecisionLevel;
  reason: string;
  examples: string[];
};

/**
 * Victory AI operating model:
 * agents own ordinary research, diagnosis, implementation planning and safe
 * recovery. The human remains the technical decision maker for architecture,
 * credentials, external accounts and irreversible production actions.
 */
export function classifyAutonomy(command: string): {
  mode: 'autonomous-with-approval-gates';
  canDoNow: string[];
  needsApproval: string[];
  userTechnicalDecisions: string[];
  safetyRules: string[];
  decisionQueue: DecisionItem[];
} {
  const text = command.toLowerCase();
  const decisionQueue: DecisionItem[] = [];
  const addDecision = (item: DecisionItem) => {
    if (!decisionQueue.some((x) => x.area === item.area)) decisionQueue.push(item);
  };

  if (/code|coding|website|web app|frontend|backend|bug|fix|refactor|api|database|schema/.test(text)) {
    addDecision({
      area: 'code-and-website',
      level: 'user-only',
      reason: 'Victory AI can investigate, design, implement and test ordinary code changes, but you choose the technical direction when multiple valid architectures exist.',
      examples: ['Choose architecture', 'Approve major code changes', 'Approve production deployment'],
    });
  }

  if (/google business|gbp|business profile|google maps profile/.test(text)) {
    addDecision({
      area: 'google-business-profile',
      level: 'approval-required',
      reason: 'Victory AI can audit and prepare GBP work, but Google account access and publishing changes require your authorization.',
      examples: ['Connect GBP', 'Choose the profile/location', 'Approve publishing changes'],
    });
  }

  if (/api key|apikey|credential|password|secret|token/.test(text)) {
    addDecision({
      area: 'credentials',
      level: 'user-only',
      reason: 'Credentials must be supplied or connected securely by you.',
      examples: ['Connect a provider', 'Add an API key in deployment settings'],
    });
  }

  const canDoNow = [
    'Understand the request, split it into a plan and assign the right agents.',
    'Research the problem, inspect source-backed evidence and diagnose failures.',
    'Retry, broaden, reroute and combine configured providers when a source fails.',
    'Write, refactor and test website/application code when the required repository access is available.',
    'Fix ordinary bugs, improve performance, improve responsive UI and verify the result.',
    'Design database/schema changes, API contracts and integration plans; execute non-destructive changes when authorized.',
    'Build lead, trend, opportunity, scoring, SEO and outreach workflows.',
    'Prepare Google Business Profile content, categories, descriptions, posts, audit findings and optimization recommendations.',
    'Verify results, remove duplicates and reject unsupported or fabricated records.',
    'Summarize what was attempted, what worked, what failed and the smallest decision needed from the user.',
  ];

  const needsApproval: string[] = [];
  if (/deploy|production|publish|release|delete|migrate|payment|billing|send|post|edit.*profile|google business|gbp|create.*listing|claim.*listing/.test(text)) {
    needsApproval.push('External, irreversible, publishing, account, payment or production actions require approval before execution.');
  }
  if (/credential|api key|password|secret|token/.test(text)) {
    needsApproval.push('Credentials and secrets are never invented or exposed; the user must provide/configure them securely.');
  }

  return {
    mode: 'autonomous-with-approval-gates',
    canDoNow,
    needsApproval,
    userTechnicalDecisions: [
      'Choose product behavior, architecture and priorities when multiple valid technical options exist.',
      'Choose whether to add, remove or replace a provider/integration.',
      'Approve production deployments, destructive changes and data migrations.',
      'Approve external-account actions such as publishing or changing a Google Business Profile.',
      'Provide or connect provider credentials when a real data source requires them.',
      'Choose business rules that cannot be safely inferred, such as target market, offer, budget or outreach limits.',
    ],
    safetyRules: [
      'Never fabricate leads, websites, contacts, reviews, business facts or evidence.',
      'Keep verified facts separate from AI predictions, scores and recommendations.',
      'Do not send outreach, publish externally or change an external account without an explicit approval gate.',
      'When a provider fails, recover with another configured source instead of manufacturing data.',
      'If a task is ambiguous but reversible, choose the safest reasonable implementation and report the assumption.',
      'If a task is irreversible, financially consequential, security-sensitive or externally published, stop and ask for approval.',
    ],
    decisionQueue,
  };
}
