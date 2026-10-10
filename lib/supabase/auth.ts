import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const STAFF_ROLES = ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR','OPERATIONS','SALES','BOOKINGS','MARKETING','CUSTOMER_SERVICE','FINANCE','HOST'] as const;
export type StaffRole = typeof STAFF_ROLES[number];
export type StaffAction = 'view'|'create'|'edit'|'assign'|'approve';
export type StaffPermissions = Record<string, Partial<Record<StaffAction, boolean>>>;
const STAFF_ROLE_PERMISSIONS: Record<StaffRole, Record<string, StaffAction[]>> = {
  SUPER_ADMIN: {},
  OPERATIONS_MANAGER: {
    guests:['view'], journeys:['view'], bookings:['view'], operations:['view','create','edit','assign','approve'],
    groups:['view','create','edit','assign'], resources:['view','create','edit','assign'],
    hosts:['view','create','edit','assign'], hotels:['view','create','edit','assign'],
    train:['view','create','edit','assign'], transportation:['view','create','edit','assign'],
    expenses:['view','create']
  },
  OPERATIONS_SUPERVISOR: {
    operations:['view','create','edit','assign'], groups:['view','create','edit','assign'],
    resources:['view','create','edit','assign'], hosts:['view','create','edit','assign'],
    hotels:['view','create','edit','assign'], train:['view','create','edit','assign'],
    transportation:['view','create','edit','assign'], expenses:['view','create']
  },
  JOURNEY_COORDINATOR: {
    operations:['view','create','edit','assign'], groups:['view'], resources:['view','assign'], expenses:['view','create']
  },
  OPERATIONS: { operations:['view','edit'], transportation:['view'] },
  SALES: {
    requests:['view','create','edit'], guests:['view','edit'], journeys:['view','edit'],
    communications:['view','create','edit']
  },
  BOOKINGS: { bookings:['view','create','edit'], guests:['view'], communications:['view','create','edit'] },
  MARKETING: { communications:['view','create','edit'] },
  CUSTOMER_SERVICE: {
    requests:['view','edit'], guests:['view','edit'], journeys:['view'], bookings:['view','edit'],
    communications:['view','create','edit']
  },
  FINANCE: {
    bookings:['view'], payments:['view','create','approve'], expenses:['view','approve'],
    reports:['view'], finance:['view']
  },
  HOST: { hostTasks:['view','edit'] }
};

export function hasStaffPermission(staff: { profile: { role?: StaffRole; permissions?: StaffPermissions | null } } | null, area: string, action: StaffAction = 'view') {
  const role = staff?.profile.role;
  if (!role || !STAFF_ROLES.includes(role)) return false;
  if (role === 'SUPER_ADMIN') return true;
  if (!STAFF_ROLE_PERMISSIONS[role][area]?.includes(action)) return false;
  const override = staff?.profile.permissions?.[area]?.[action];
  return override !== false;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_', 'x3cFwO1f_', 'MB4mnfS2uqNfg_9CvxRZE_'].join('');

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
  const { data: profile } = await supabase.from('profiles').select('id,full_name,role,manager_id,department,permissions').eq('id', user.id).single();
  if (!profile || !STAFF_ROLES.includes(profile.role as StaffRole)) return null;
  return { user, profile: { ...profile, role: profile.role as StaffRole } };
}

export async function requireStaff() {
  const staff = await getCurrentStaff();
  if (!staff) redirect('/admin/login');
  return staff;
}
