import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import { getAdminLocale } from '@/lib/admin-locale';
import { adminText } from '@/lib/admin-text';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type NavItem={en:string;ar:string;href:string;roles?:string[]};
const nav:NavItem[]=[
 {en:'Dashboard',ar:'لوحة التحكم',href:'/admin'},
 {en:'Journey Requests',ar:'طلبات الرحلات',href:'/admin/requests',roles:['SUPER_ADMIN','ADMIN','SALES']},
 {en:'Customers',ar:'العملاء',href:'/admin/guests',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Journeys',ar:'الرحلات',href:'/admin/journeys',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Bookings',ar:'الحجوزات',href:'/admin/bookings',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Operations',ar:'العمليات والمهام',href:'/admin/operations',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Groups',ar:'المجموعات',href:'/admin/groups',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Resources',ar:'الموارد',href:'/admin/operations',roles:['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Payments',ar:'المدفوعات',href:'/admin/payments',roles:['SUPER_ADMIN','ADMIN','SALES','FINANCE']},
 {en:'Expenses',ar:'المصروفات',href:'/admin/expenses',roles:['SUPER_ADMIN','ADMIN','FINANCE']},
 {en:'Reports',ar:'التقارير',href:'/admin/reports',roles:['SUPER_ADMIN','ADMIN']},
 {en:'Audit Logs',ar:'سجل النشاط',href:'/admin/audit-logs',roles:['SUPER_ADMIN','ADMIN']},
 {en:'Communications',ar:'التواصل',href:'/admin/communications',roles:['SUPER_ADMIN','ADMIN','SALES','OPERATIONS_MANAGER','OPERATIONS']},
 {en:'Reviews',ar:'التقييمات',href:'/admin/reviews',roles:['SUPER_ADMIN','ADMIN']},
 {en:'Team & Permissions',ar:'الفريق والصلاحيات',href:'/admin/team',roles:['SUPER_ADMIN']},
 {en:'Settings',ar:'الإعدادات',href:'/admin/settings',roles:['SUPER_ADMIN','ADMIN']}
];

export default async function AdminLayout({children}:{children:React.ReactNode}){
 const staff=await getCurrentStaff();
 const locale=await getAdminLocale();
 const t=adminText[locale];
 if(!staff)return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="admin-shell min-h-screen min-w-0 overflow-x-hidden bg-[#f3f0e7]"><div className="border-b border-forest/10 bg-forest text-white"><div className="container flex min-h-16 items-center justify-between"><Link href="/admin/login" className="font-semibold tracking-wide">ALHARAMAIN ELITE <span className="text-gold">/ ADMIN</span></Link><AdminLanguageSelector/></div></div>{children}</div>;
 const role=staff.profile.role;
 const visibleNav=nav.filter(item=>!item.roles||item.roles.includes(role));
 const label=(item:NavItem)=>locale==='ar'?item.ar:item.en;
 return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="min-h-screen bg-[#f3f0e7]">
  <div className="border-b border-forest/10 bg-forest text-white">
   <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-2 sm:flex-nowrap sm:py-0">
    <Link href="/admin" className="font-semibold tracking-wide">ALHARAMAIN ELITE <span className="text-gold">/ ADMIN</span></Link>
    <div className="flex items-center gap-3">
     <AdminLanguageSelector/>
     <div className={`${locale==='ar'?'text-left':'text-right'} min-w-0 max-w-[38vw] text-xs sm:max-w-none`}>
      <div className="break-words">{staff.profile.full_name||staff.user.email}</div>
      <div className="mt-1 text-white/55">{role}</div>
     </div>
     <AdminLogout locale={locale}/>
    </div>
   </div>
  </div>
  <div className="container grid min-w-0 gap-4 py-4 sm:gap-5 sm:py-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-7 xl:py-7">
   <aside className="card h-fit min-w-0 overflow-x-auto p-2 lg:sticky lg:top-6 lg:overflow-visible">
    <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest/40">{t.workspace}</div>
    <nav className="flex min-w-max gap-1 lg:grid lg:min-w-0 lg:grid-cols-1">
     {visibleNav.map(item=><Link key={item.href} href={item.href} className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-forest transition hover:bg-[#f2eee3] hover:text-gold">{label(item)}</Link>)}
    </nav>
   </aside>
   <div className="min-w-0 overflow-hidden">{children}</div>
  </div>
 </div>;
}
