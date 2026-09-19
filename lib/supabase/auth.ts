import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const STAFF_ROLES = ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export async function getCurrentStaff() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createServerClient(url, key, {
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
