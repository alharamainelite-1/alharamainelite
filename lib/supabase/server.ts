import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_', 'x3cFwO1f_', 'MB4mnfS2uqNfg_9CvxRZE_'].join('');

export function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}
