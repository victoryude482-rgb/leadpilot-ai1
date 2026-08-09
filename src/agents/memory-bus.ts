import type { AgentEvent, AgentEventType, AgentMemoryStore, AgentName, MemoryRecord } from '../../docs/agent-contract';

export class InMemoryAgentBus implements AgentMemoryStore {
  private memories: MemoryRecord<any>[] = [];
  private events: AgentEvent<any>[] = [];

  async getRelevantMemory(query: {
    accountId: string;
    leadId?: string;
    conversationId?: string;
    scopes?: MemoryRecord['scope'][];
    limit?: number;
  }): Promise<MemoryRecord[]> {
    return this.memories
      .filter((m) => m.accountId === query.accountId)
      .filter((m) => !query.leadId || m.leadId === query.leadId)
      .filter((m) => !query.conversationId || m.conversationId === query.conversationId)
      .filter((m) => !query.scopes?.length || query.scopes.includes(m.scope))
      .slice(-(query.limit ?? 50));
  }

  async saveMemory<T>(memory: Omit<MemoryRecord<T>, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryRecord<T>> {
    const now = new Date().toISOString();
    const record: MemoryRecord<T> = { ...memory, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this.memories.push(record);
    return record;
  }

  async appendEvent<T>(event: Omit<AgentEvent<T>, 'eventId' | 'createdAt'>): Promise<AgentEvent<T>> {
    const record: AgentEvent<T> = { ...event, eventId: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.events.push(record);
    return record;
  }

  async publishLeadScored(input: {
    accountId: string;
    leadId: string;
    agent?: AgentName;
    score: number;
    label: string;
  }) {
    return this.appendEvent({
      accountId: input.accountId,
      leadId: input.leadId,
      agent: input.agent ?? 'scoring',
      type: 'lead.scored' as AgentEventType,
      payload: { score: input.score, label: input.label },
    });
  }
}
