import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const STAFF_ROLES = ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_', 'x3cFwO1f_', 'MB4mnfS2uqNfg_9CvxRZE_'].join('');

export async function getCurrentStaff() {
  const cookieStore = await cookies();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('id,full_name,role').eq('id', user.id).single();
  if (!profile || !STAFF_ROLES.includes(profile.role as StaffRole)) return null;
  return { user, profile: { ...profile, role: profile.role as StaffRole } };
}

export async function requireStaff() {
  const staff = await getCurrentStaff();
  if (!staff) redirect('/admin/login');
  return staff;
}
