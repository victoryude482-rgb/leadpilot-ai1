export interface DashboardMetrics {
  totalLeads: number;
  verifiedLeads: number;
  hotLeads: number;
  contacted: number;
  replies: number;
  interested: number;
  meetings: number;
  customers: number;
}

export function calculateDashboardMetrics(statuses: string[], scores: number[]): DashboardMetrics {
  const count = (status: string) => statuses.filter((s) => s === status).length;
  return {
    totalLeads: statuses.length,
    verifiedLeads: count('VERIFIED'),
    hotLeads: scores.filter((s) => s >= 90).length,
    contacted: count('CONTACTED'),
    replies: count('REPLIED'),
    interested: count('INTERESTED'),
    meetings: count('MEETING'),
    customers: count('CUSTOMER'),
  };
}
