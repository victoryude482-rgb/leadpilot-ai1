export interface AuthenticatedUser {
  id: string;
}

/**
 * Server auth boundary. The production adapter should validate the Supabase
 * session using the server-side Supabase client before returning a user id.
 * Never trust an account id supplied by the browser.
 */
export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  // Deliberately fail closed until the Supabase server client is configured.
  // This prevents an unverified bearer value from becoming an account id.
  return null;
}
