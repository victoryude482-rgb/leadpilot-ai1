import type { CommunicationDecision, CommunicationMessage } from './types';
import { COMMUNICATION_POLICY } from './policy';

function naturalize(text: string) {
  return text.replace(/\butilize\b/gi, 'use').replace(/\bseamless\b/gi, 'simple').replace(/\bcutting-edge\b/gi, 'modern').trim();
}

export function decideClientReply(message: CommunicationMessage, context: string[] = []): CommunicationDecision {
  const text = message.text.trim();
  const lower = text.toLowerCase();
  const needsHuman = /contract|agreement|guarantee|refund|payment|pay now|quote|price|discount|legal|complaint|cancel|password|api key|secret/.test(lower);

  let reply = 'Thanks for reaching out. I can help with that. Tell me a little more about what you need, and I’ll point you in the right direction.';
  if (/hello|hi|hey\b/.test(lower)) reply = 'Hi! Thanks for reaching out. What can I help you with?';
  else if (/website|web site|site/.test(lower)) reply = 'Absolutely. We can look at what you need the website to do, the pages you want, and any features such as bookings, payments, or a shop. If you share a few details, I can help map out the right approach.';
  else if (/logo|branding|brand/.test(lower)) reply = 'Yes, we can help with the brand side too. Tell me the business name, what you do, and the kind of feeling you want customers to get from the brand.';
  else if (/job|freelance|work/.test(lower)) reply = 'I can help understand the project and prepare a practical plan. Send the job details or tell me what you are trying to get done.';

  reply = naturalize(reply);
  return {
    action: needsHuman ? 'draft' : 'reply',
    text: reply,
    requiresApproval: needsHuman,
    reason: needsHuman ? 'The message touches a commitment, money, credentials, dispute, or other high-impact topic.' : 'Routine low-risk conversational reply.',
    factsUsed: context,
  };
}

export const communicationRules = COMMUNICATION_POLICY;
