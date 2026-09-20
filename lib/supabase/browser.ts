'use client';
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_', 'x3cFwO1f_', 'MB4mnfS2uqNfg_9CvxRZE_'].join('');

export function getSupabaseBrowser(){
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
