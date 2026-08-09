import type { AuthenticatedUser } from './server-auth';

/**
 * Supabase server-auth seam. The actual Supabase SDK is intentionally not
 * bundled until the project URL/keys are configured in the deployment.
 *
 * Expected environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * This module fails closed rather than accepting an unverified client value.
 */
export async function getSupabaseAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  // SDK/session validation is the deployment-specific step. Never treat the
  // bearer token itself as an account id.
  return null;
}
