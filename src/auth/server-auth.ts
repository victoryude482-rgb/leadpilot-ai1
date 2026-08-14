export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Server auth boundary. The production adapter must validate the Supabase
 * session before returning a user. Never trust an account id supplied by the browser.
 */
export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return null;
}
