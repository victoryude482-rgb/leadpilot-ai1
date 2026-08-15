export type DecisionLevel = 'autonomous' | 'approval-required' | 'user-only';

export type DecisionItem = {
  area: string;
  level: DecisionLevel;
  reason: string;
  examples: string[];
};

/**
 * Defines what Victory AI can solve on its own and what must remain a human decision.
 * The goal is to let agents diagnose, research, code, test and recover automatically,
 * while keeping irreversible/external-account actions under user control.
 */
export function classifyAutonomy(command: string): {
  mode: 'autonomous-with-approval-gates';
  canDoNow: string[];
  needsApproval: string[];
  userTechnicalDecisions: string[];
  safetyRules: string[];
} {
  const text = command.toLowerCase();
  const canDoNow = [
    'Research the problem and inspect available evidence.',
    'Break the request into tasks and assign the right agents.',
    'Diagnose failures, retry providers, broaden searches and verify outputs.',
    'Write or propose website/code changes and run available tests/checks.',
    'Compare implementation options and explain trade-offs.',
    'Prepare content, SEO, outreach, lead-scoring and Google Business Profile drafts.',
  ];

  const needsApproval: string[] = [];
  if (/deploy|production|publish|release|delete|migrate|payment|billing|send|post|edit.*profile|google business|gbp/.test(text)) {
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
      'Choose product behavior and priorities when there are legitimate alternatives.',
      'Approve production deployments or destructive changes.',
      'Approve external-account changes such as Google Business Profile updates.',
      'Provide or connect paid/provider credentials when a real data source requires them.',
    ],
    safetyRules: [
      'Never fabricate leads, websites, contacts, reviews, business facts or evidence.',
      'Keep verified facts separate from AI predictions and recommendations.',
      'Do not send outreach or publish externally without an explicit approval gate.',
      'When a provider fails, recover with another configured source instead of manufacturing data.',
    ],
  };
}
