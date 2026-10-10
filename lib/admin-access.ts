import type { StaffRole } from '@/lib/supabase/auth';

export const ADMIN_ACCESS = {
  requests: ['SUPER_ADMIN','SALES','CUSTOMER_SERVICE'],
  guests: ['SUPER_ADMIN','SALES','CUSTOMER_SERVICE','OPERATIONS_MANAGER','OPERATIONS'],
  journeys: ['SUPER_ADMIN','SALES','CUSTOMER_SERVICE','OPERATIONS_MANAGER','OPERATIONS'],
  bookings: ['SUPER_ADMIN','SALES','CUSTOMER_SERVICE','FINANCE','OPERATIONS_MANAGER','OPERATIONS'],
  operations: ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR','OPERATIONS'],
  groups: ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'],
  departures: ['SUPER_ADMIN','OPERATIONS_MANAGER'],
  resources: ['SUPER_ADMIN','OPERATIONS_MANAGER'],
  payments: ['SUPER_ADMIN','FINANCE'],
  finance: ['SUPER_ADMIN','FINANCE'],
  custody: ['SUPER_ADMIN','FINANCE'],
  expenses: ['SUPER_ADMIN','FINANCE'],
  reports: ['SUPER_ADMIN','FINANCE'],
  communications: ['SUPER_ADMIN','SALES','MARKETING','CUSTOMER_SERVICE'],
  reviews: ['SUPER_ADMIN'],
  influencers: ['SUPER_ADMIN'],
  team: ['SUPER_ADMIN'],
  staffMonitoring: ['SUPER_ADMIN'],
  settings: ['SUPER_ADMIN'],
  audit: ['SUPER_ADMIN'],
  hosts: ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','OPERATIONS'],
  hotels: ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','OPERATIONS'],
  train: ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','OPERATIONS'],
  transportation: ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','OPERATIONS'],
  hostTasks: ['HOST'],
} as const satisfies Record<string, readonly StaffRole[]>;

export function roleCanAccess(role: StaffRole, area: keyof typeof ADMIN_ACCESS, permissions?: Record<string, Record<string, boolean>>) {
  if (!(ADMIN_ACCESS[area] as readonly StaffRole[]).includes(role)) return false;
  if (role === 'SUPER_ADMIN') return true;
  return permissions?.[area]?.view !== false;
}

export function areaForAdminPath(pathname: string): keyof typeof ADMIN_ACCESS | null {
  const map: Array<[string, keyof typeof ADMIN_ACCESS]> = [
    ['/admin/requests','requests'],['/admin/guests','guests'],['/admin/journeys','journeys'],
    ['/admin/bookings','bookings'],['/admin/operations','operations'],['/admin/groups','groups'],
    ['/admin/departures','departures'],['/admin/payments','payments'],['/admin/finance','finance'],
    ['/admin/custody','custody'],['/admin/expenses','expenses'],['/admin/reports','reports'],
    ['/admin/communications','communications'],['/admin/reviews','reviews'],['/admin/influencer-partners','influencers'],
    ['/admin/team','team'],['/admin/staff-monitoring','staffMonitoring'],['/admin/settings','settings'],
    ['/admin/audit-logs','audit'],['/admin/hosts','hosts'],['/admin/hotels','hotels'],
    ['/admin/train','train'],['/admin/transportation','transportation'],['/admin/host-tasks','hostTasks'],
  ];
  const match = map.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return match?.[1] ?? null;
}
