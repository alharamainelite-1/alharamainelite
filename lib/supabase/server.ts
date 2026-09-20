import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';

export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }
  return createClient(SUPABASE_URL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
