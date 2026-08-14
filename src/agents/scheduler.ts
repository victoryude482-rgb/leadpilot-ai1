export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly';

export interface AgentSchedule {
  id: string;
  userId: string;
  agentId: string;
  query: string;
  location?: string;
  industry?: string;
  limitCount: number;
  frequency: ScheduleFrequency;
  active: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  lastStatus?: string;
  lastResultCount: number;
}

export function nextRun(from: Date, frequency: ScheduleFrequency): Date {
  const next = new Date(from);
  if (frequency === 'hourly') next.setHours(next.getHours() + 1);
  else if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else next.setDate(next.getDate() + 7);
  return next;
}

export function isDue(schedule: Pick<AgentSchedule, 'active' | 'nextRunAt'>, now = new Date()): boolean {
  return schedule.active && new Date(schedule.nextRunAt).getTime() <= now.getTime();
}
