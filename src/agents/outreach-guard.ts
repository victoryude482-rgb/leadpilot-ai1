export interface OutreachGuardInput {
  optedOut?: boolean;
  consent?: boolean;
  email?: string;
  phone?: string;
  sentToday?: number;
}

export function canSendOutreach(input: OutreachGuardInput): { allowed: boolean; reason: string } {
  if (input.optedOut) return { allowed: false, reason: 'Lead opted out.' };
  if (!input.email && !input.phone) return { allowed: false, reason: 'No reachable contact channel.' };
  if ((input.sentToday ?? 0) >= 3) return { allowed: false, reason: 'Daily automated-contact limit reached.' };
  return { allowed: true, reason: 'Eligible for outreach.' };
}
