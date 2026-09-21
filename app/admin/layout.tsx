import Link from 'next/link';
import { cookies } from 'next/headers';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';

type NavItem={en:string;ar:string;href:string;roles?:string[]};
const nav:NavItem[]=[
 {en:'Dashboard',ar:'لوحة التحكم',href:'/admin'},
 {en:'Journey Requests',ar:'طلبات الرحلات',href:'/admin/requests',roles:['SUPER_ADMIN','ADMIN','SALES']},
 {en:'Customers / Guests',ar:'العملاء والضيوف',href:'/admin/guests',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Bookings',ar:'الحجوزات',href:'/admin/bookings',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Operations',ar:'العمليات والمهام',href:'/admin/operations',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Groups',ar:'المجموعات',href:'/admin/groups',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Hotels',ar:'الفنادق',href:'/admin/hotels',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Transportation',ar:'النقل',href:'/admin/transportation',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Train',ar:'القطار',href:'/admin/train',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Hosts',ar:'المضيفون',href:'/admin/hosts',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Payments',ar:'المدفوعات',href:'/admin/payments',roles:['SUPER_ADMIN','ADMIN','SALES','FINANCE']},
 {en:'Expenses',ar:'المصروفات',href:'/admin/expenses',roles:['SUPER_ADMIN','ADMIN','FINANCE']},
 {en:'Reports',ar:'التقارير',href:'/admin/reports',roles:['SUPER_ADMIN','ADMIN']},
 {en:'Audit Logs',ar:'سجل النشاط',href:'/admin/audit-logs',roles:['SUPER_ADMIN','ADMIN']},
 {en:'Communications',ar:'التواصل',href:'/admin/communications',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Reviews',ar:'التقييمات',href:'/admin/reviews',roles:['SUPER_ADMIN','ADMIN']},
 {en:'Settings',ar:'الإعدادات',href:'/admin/settings',roles:['SUPER_ADMIN','ADMIN']}
];

export default async function AdminLayout({children}:{children:React.ReactNode}){
 const staff=await getCurrentStaff();
 if(!staff)return <>{children}</>;
 const locale=(await cookies()).get('he_locale')?.value==='ar'?'ar':'en';
 const role=staff.profile.role;
 const visibleNav=nav.filter(item=>!item.roles||item.roles.includes(role));
 const label=(item:NavItem)=>locale==='ar'?item.ar:item.en;
 return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="min-h-screen bg-[#f3f0e7]">
  <div className="border-b border-forest/10 bg-forest text-white">
   <div className="container flex min-h-16 items-center justify-between gap-4">
    <Link href="/admin" className="font-semibold tracking-wide">ALHARAMAIN ELITE <span className="text-gold">/ ADMIN</span></Link>
    <div className="flex items-center gap-3">
     <AdminLanguageSelector/>
     <div className={locale==='ar'?'text-left text-xs':'text-right text-xs'}>
      <div>{staff.profile.full_name||staff.user.email}</div>
      <div className="mt-1 text-white/55">{role}</div>
     </div>
     <AdminLogout/>
    </div>
   </div>
  </div>
  <div className="container grid gap-6 py-6 lg:grid-cols-[240px_1fr]">
   <aside className="card h-fit p-3 lg:sticky lg:top-6">
    <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest/40">Workspace</div>
    <nav className="grid gap-1">
     {visibleNav.map(item=><Link key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 text-sm text-forest transition hover:bg-[#f2eee3] hover:text-gold">{label(item)}</Link>)}
    </nav>
   </aside>
   <div>{children}</div>
  </div>
 </div>;
}
