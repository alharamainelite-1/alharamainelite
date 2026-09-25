import type { StaffRole } from '@/lib/supabase/auth';

export const ADMIN_ACCESS = {
  requests: ['SUPER_ADMIN','ADMIN','SALES'],
  guests: ['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS'],
  journeys: ['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS'],
  bookings: ['SUPER_ADMIN','ADMIN','SALES','FINANCE','OPERATIONS_MANAGER','OPERATIONS'],
  operations: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  groups: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  resources: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  payments: ['SUPER_ADMIN','FINANCE'],
  expenses: ['SUPER_ADMIN','FINANCE'],
  reports: ['SUPER_ADMIN','FINANCE'],
  communications: ['SUPER_ADMIN','ADMIN','SALES'],
  reviews: ['SUPER_ADMIN','ADMIN'],
  influencers: ['SUPER_ADMIN','ADMIN'],
  team: ['SUPER_ADMIN'],
  settings: ['SUPER_ADMIN','ADMIN'],
  audit: ['SUPER_ADMIN','ADMIN'],
  hosts: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  hotels: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  train: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  transportation: ['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
} as const satisfies Record<string, readonly StaffRole[]>;

export function roleCanAccess(role: StaffRole, area: keyof typeof ADMIN_ACCESS) {
  return (ADMIN_ACCESS[area] as readonly StaffRole[]).includes(role);
}

export function areaForAdminPath(pathname: string): keyof typeof ADMIN_ACCESS | null {
  const map: Array<[string, keyof typeof ADMIN_ACCESS]> = [
    ['/admin/requests','requests'],['/admin/guests','guests'],['/admin/journeys','journeys'],
    ['/admin/bookings','bookings'],['/admin/operations','operations'],['/admin/groups','groups'],
    ['/admin/payments','payments'],['/admin/expenses','expenses'],['/admin/reports','reports'],
    ['/admin/communications','communications'],['/admin/reviews','reviews'],['/admin/influencer-partners','influencers'],
    ['/admin/team','team'],['/admin/settings','settings'],['/admin/audit-logs','audit'],
    ['/admin/hosts','hosts'],['/admin/hotels','hotels'],['/admin/train','train'],['/admin/transportation','transportation'],
  ];
  const match = map.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return match?.[1] ?? null;
}
