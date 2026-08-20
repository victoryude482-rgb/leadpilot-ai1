export type Channel = 'telegram' | 'whatsapp' | 'web';
export type MessageDirection = 'inbound' | 'outbound';

export type CommunicationMessage = {
  id: string;
  channel: Channel;
  conversationId: string;
  direction: MessageDirection;
  text: string;
  createdAt: string;
  requiresApproval?: boolean;
};

export type CommunicationDecision = {
  action: 'reply' | 'escalate' | 'draft';
  text: string;
  requiresApproval: boolean;
  reason: string;
  factsUsed: string[];
};
