export type AgentName =
  | 'lead-finder'
  | 'trend-finder'
  | 'opportunity-finder'
  | 'tender-finder'
  | 'competitor-monitor'
  | 'outreach'
  | 'ecommerce-opportunity'
  | 'content'
  | 'command-agent'
  | 'verification'
  | 'scoring'
  | 'crm'
  | 'sales';

export type AgentEventType =
  | 'lead.discovered'
  | 'lead.verified'
  | 'lead.scored'
  | 'lead.status_changed'
  | 'opportunity.discovered'
  | 'trend.discovered'
  | 'tender.discovered'
  | 'competitor.changed'
  | 'outreach.drafted'
  | 'outreach.sent'
  | 'conversation.updated'
  | 'lead.qualified'
  | 'meeting.booked'
  | 'customer.won';

export interface AgentEvent<T = Record<string, unknown>> {
  eventId: string;
  accountId: string;
  leadId?: string;
  agent: AgentName;
  type: AgentEventType;
  payload: T;
  createdAt: string;
}

export interface MemoryRecord<T = Record<string, unknown>> {
  id: string;
  accountId: string;
  leadId?: string;
  businessId?: string;
  conversationId?: string;
  scope: 'account' | 'lead' | 'conversation' | 'system';
  memoryType: 'verified_fact' | 'inference' | 'summary' | 'preference' | 'configuration';
  content: T;
  source?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDefinition {
  id: AgentName;
  name: string;
  description: string;
  category: 'research' | 'sales' | 'monitoring' | 'content';
  status: 'live' | 'beta' | 'planned';
  capabilities: string[];
}

export interface AgentMemoryStore {
  getRelevantMemory(query: {
    accountId: string;
    leadId?: string;
    conversationId?: string;
    scopes?: MemoryRecord['scope'][];
    limit?: number;
  }): Promise<MemoryRecord[]>;

  saveMemory<T>(memory: Omit<MemoryRecord<T>, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryRecord<T>>;

  appendEvent<T>(event: Omit<AgentEvent<T>, 'eventId' | 'createdAt'>): Promise<AgentEvent<T>>;
}
