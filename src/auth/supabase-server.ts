import { createClient } from '@supabase/supabase-js';
import type { AuthenticatedUser } from './server-auth';

/** Validate the bearer token with Supabase. The token itself is never used as an account id. */
export async function getSupabaseAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { id: data.user.id };
}
