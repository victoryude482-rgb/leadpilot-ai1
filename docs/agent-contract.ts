export type AgentName =
  | 'lead-finder'
  | 'verification'
  | 'scoring'
  | 'crm'
  | 'outreach'
  | 'sales';

export type AgentEventType =
  | 'lead.discovered'
  | 'lead.verified'
  | 'lead.scored'
  | 'lead.status_changed'
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

/**
 * Agents communicate through canonical IDs and durable events.
 * They must not copy entire lead records into private agent state.
 */
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
