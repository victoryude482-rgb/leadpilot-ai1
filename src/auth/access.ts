export interface AuthContext {
  userId: string;
  accountId: string;
}

export function requireAccountAccess(context: AuthContext | null, accountId: string): AuthContext {
  if (!context) throw new Error('Authentication required');
  if (context.accountId !== accountId) throw new Error('Forbidden');
  return context;
}
