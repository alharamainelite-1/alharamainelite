import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import { getAdminLocale } from '@/lib/admin-locale';
import { adminText } from '@/lib/admin-text';
import { ADMIN_ACCESS } from '@/lib/admin-access';
export const dynamic='force-dynamic';
export const metadata:Metadata={robots:{index:false,follow:false}};
type NavItem={en:string;ar:string;href:string;roles?:string[]};
type NavGroup={key:string;en:string;ar:string;items:NavItem[]};
const nav:NavItem[]=[
 {en:'Dashboard',ar:'لوحة التحكم',href:'/admin'},
 {en:'General Management Results',ar:'نتائج الإدارة العامة والقرارات',href:'/admin/general-management',roles:['SUPER_ADMIN']},
 {en:'Journey Requests',ar:'طلبات الرحلات',href:'/admin/requests',roles:[...ADMIN_ACCESS.requests]},
 {en:'FAMILY & FRIENDS',ar:'العائلة والأصدقاء — عروض الأسعار',href:'/admin/family-friends',roles:['SUPER_ADMIN','SALES','CUSTOMER_SERVICE']},
 {en:'Customers',ar:'العملاء',href:'/admin/guests',roles:[...ADMIN_ACCESS.guests]},
 {en:'Journeys',ar:'الرحلات',href:'/admin/journeys',roles:[...ADMIN_ACCESS.journeys]},
 {en:'Bookings',ar:'الحجوزات',href:'/admin/bookings',roles:[...ADMIN_ACCESS.bookings]},
 {en:'Operational Booking Requests',ar:'طلبات الحجوزات التشغيلية',href:'/admin/operations-booking-requests',roles:[...ADMIN_ACCESS.operationsBookingRequests]},
 {en:'Guest Care',ar:'تجربة الضيوف',href:'/admin/guest-care',roles:[...ADMIN_ACCESS.guestSupport]},
 {en:'Operations Lead',ar:'قيادة العمليات',href:'/admin/operations-lead',roles:['SUPER_ADMIN','OPERATIONS_MANAGER']},
 {en:'Operations Supervision',ar:'إشراف العمليات',href:'/admin/operations-supervision',roles:['SUPER_ADMIN','OPERATIONS_SUPERVISOR','OPERATIONS_MANAGER']},
 {en:'Journey Coordinator Workspace',ar:'مساحة منسق الرحلات',href:'/admin/journey-workspace',roles:['SUPER_ADMIN','JOURNEY_COORDINATOR','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR']},
 {en:'Staff Tasks & Handover',ar:'مهام الموظفين والتسليم',href:'/admin/staff-tasks',roles:[...ADMIN_ACCESS.staffTasks]},
 {en:'Visa & Insurance',ar:'التأشيرات والتأمين',href:'/admin/visa-insurance',roles:['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES']},
 {en:'Departure Schedule',ar:'مواعيد الانطلاق',href:'/admin/departures',roles:['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR']},
 {en:'Operations',ar:'العمليات والمهام',href:'/admin/operations',roles:[...ADMIN_ACCESS.operations]},
 {en:'Groups',ar:'المجموعات',href:'/admin/groups',roles:[...ADMIN_ACCESS.groups]},
 {en:'Finance Center',ar:'المركز المالي',href:'/admin/finance',roles:[...ADMIN_ACCESS.finance]},
 {en:'Custody',ar:'العهد',href:'/admin/custody',roles:[...ADMIN_ACCESS.custody]},
 {en:'Payments',ar:'المدفوعات',href:'/admin/payments',roles:[...ADMIN_ACCESS.payments]},
 {en:'Expenses',ar:'المصروفات',href:'/admin/expenses',roles:[...ADMIN_ACCESS.expenses]},
 {en:'Reports',ar:'التقارير',href:'/admin/reports',roles:[...ADMIN_ACCESS.reports]},
 {en:'Audit Logs',ar:'سجل النشاط',href:'/admin/audit-logs',roles:[...ADMIN_ACCESS.audit]},
 {en:'Communications',ar:'التواصل',href:'/admin/communications',roles:[...ADMIN_ACCESS.communications]},
 {en:'Reviews',ar:'التقييمات',href:'/admin/reviews',roles:[...ADMIN_ACCESS.reviews]},
 {en:'Influencer Partners',ar:'شركاء المؤثرين',href:'/admin/influencer-partners',roles:[...ADMIN_ACCESS.influencers]},
 {en:'Team & Permissions',ar:'الفريق والصلاحيات',href:'/admin/team',roles:[...ADMIN_ACCESS.team]},
 {en:'Staff Monitoring',ar:'رقابة الموظفين',href:'/admin/staff-monitoring',roles:[...ADMIN_ACCESS.staffMonitoring]},
 {en:'Settings',ar:'الإعدادات',href:'/admin/settings',roles:[...ADMIN_ACCESS.settings]},
 {en:'My Tasks',ar:'مهامي',href:'/admin/host-tasks',roles:[...ADMIN_ACCESS.hostTasks]}
];
export default async function AdminLayout({children}:{children:React.ReactNode}){const staff=await getCurrentStaff();const locale=await getAdminLocale();const t=adminText[locale];if(!staff)return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="admin-shell min-h-screen min-w-0 overflow-x-hidden bg-[#f3f0e7]"><div className="border-b border-forest/10 bg-forest text-white"><div className="container flex min-h-16 items-center justify-between"><Link href="/admin/login" className="font-semibold tracking-wide">ALHARAMAIN ELITE <span className="text-gold">/ ADMIN</span></Link><AdminLanguageSelector/></div></div>{children}</div>;const role=staff.profile.role;const visibleNav=nav.filter(item=>(!item.roles||item.roles.includes(role))&&(()=>{const area=Object.entries({requests:'/admin/requests',guests:'/admin/guests',journeys:'/admin/journeys',bookings:'/admin/bookings',operations:'/admin/operations',groups:'/admin/groups',departures:'/admin/departures',payments:'/admin/payments',finance:'/admin/finance',custody:'/admin/custody',expenses:'/admin/expenses',reports:'/admin/reports',communications:'/admin/communications',reviews:'/admin/reviews',influencers:'/admin/influencer-partners',team:'/admin/team',staffMonitoring:'/admin/staff-monitoring',settings:'/admin/settings',hosts:'/admin/hosts',hotels:'/admin/hotels',train:'/admin/train',transportation:'/admin/transportation',hostTasks:'/admin/host-tasks'}).find(([,href])=>item.href===href)?.[0];return !area||staff.profile.permissions?.[area]?.view!==false;})());const roleNav:Record<string,string[]>={
 SALES:['/admin/requests','/admin/family-friends','/admin/guests','/admin/journeys','/admin/communications','/admin/staff-tasks'],BOOKINGS:['/admin/bookings','/admin/guests','/admin/communications','/admin/staff-tasks','/admin/operations-booking-requests'],OPERATIONS_BOOKINGS:['/admin/operations-booking-requests','/admin/bookings','/admin/transportation','/admin/train'],FINANCE:['/admin/finance','/admin/custody','/admin/bookings','/admin/payments','/admin/expenses','/admin/reports'],OPERATIONS_MANAGER:['/admin/guests','/admin/journeys','/admin/bookings','/admin/visa-insurance','/admin/departures','/admin/operations','/admin/groups','/admin/hosts','/admin/hotels','/admin/train','/admin/transportation','/admin/operations-lead','/admin/operations-supervision','/admin/journey-workspace','/admin/operations-booking-requests','/admin/guest-care'],OPERATIONS_SUPERVISOR:['/admin/departures','/admin/operations','/admin/groups','/admin/hosts','/admin/hotels','/admin/train','/admin/transportation','/admin/operations-supervision','/admin/journey-workspace','/admin/operations-booking-requests','/admin/guest-care'],JOURNEY_COORDINATOR:['/admin/operations','/admin/groups','/admin/journey-workspace','/admin/operations-booking-requests','/admin/guest-care'],OPERATIONS:['/admin/operations','/admin/transportation','/admin/visa-insurance','/admin/operations-booking-requests'],MARKETING:['/admin/communications'],CUSTOMER_SERVICE:['/admin/requests','/admin/family-friends','/admin/guests','/admin/journeys','/admin/bookings','/admin/communications','/admin/staff-tasks','/admin/guest-care'],HOST:['/admin/host-tasks'],SUPER_ADMIN:nav.map(x=>x.href)};
const allowed=[...(roleNav[role]||[]),'/admin/staff-tasks'];const filteredNav=visibleNav.filter(item=>item.href==='/admin'||allowed.includes(item.href));
const sectionFor=(href:string):string=>{
 if(['/admin','/admin/general-management','/admin/staff-monitoring','/admin/team','/admin/settings','/admin/audit-logs'].includes(href)) return 'management';
 if(['/admin/requests','/admin/family-friends','/admin/guests','/admin/communications','/admin/influencer-partners','/admin/reviews','/admin/guest-care'].includes(href)) return 'sales';
 if(['/admin/journeys','/admin/bookings','/admin/operations-booking-requests','/admin/visa-insurance','/admin/departures','/admin/groups'].includes(href)) return 'journeys';
 if(['/admin/operations','/admin/operations-lead','/admin/operations-supervision','/admin/journey-workspace','/admin/staff-tasks','/admin/hosts','/admin/hotels','/admin/train','/admin/transportation','/admin/host-tasks'].includes(href)) return 'operations';
 if(['/admin/finance','/admin/payments','/admin/expenses','/admin/custody','/admin/reports'].includes(href)) return 'finance';
 return 'management';
};
const groupMeta:Record<string,{en:string;ar:string}>={
 management:{en:'Management & Overview',ar:'الإدارة والرئيسية'},
 sales:{en:'Sales & Customers',ar:'المبيعات والعملاء'},
 journeys:{en:'Bookings & Journeys',ar:'الحجوزات والرحلات'},
 operations:{en:'Operations & Resources',ar:'العمليات والموارد'},
 finance:{en:'Finance',ar:'المالية'}
};
const navGroups:NavGroup[]=['management','sales','journeys','operations','finance'].map(key=>({key,...groupMeta[key],items:filteredNav.filter(item=>sectionFor(item.href)===key)})).filter(group=>group.items.length>0);
const label=(item:NavItem)=>locale==='ar'?item.ar:item.en;const roleLabel=(r:string)=>locale==='ar'?({SUPER_ADMIN:'المدير العام',OPERATIONS_MANAGER:'مدير العمليات',OPERATIONS_SUPERVISOR:'مشرف العمليات',JOURNEY_COORDINATOR:'منسق الرحلات',OPERATIONS:'موظف العمليات',OPERATIONS_BOOKINGS:'مسؤول الحجوزات التشغيلية',SALES:'المبيعات',BOOKINGS:'الحجوزات',MARKETING:'التسويق',CUSTOMER_SERVICE:'خدمة العملاء',FINANCE:'المالية',HOST:'المضيف'} as Record<string,string>)[r]||r:r.replaceAll('_',' ');
return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="admin-shell min-h-screen min-w-0 max-w-full overflow-x-hidden bg-[#f3f0e7]"><div className="border-b border-forest/10 bg-forest text-white"><div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-2 sm:flex-nowrap sm:py-0"><Link href="/admin" className="font-semibold tracking-wide">ALHARAMAIN ELITE <span className="text-gold">/ ADMIN</span></Link><div className="flex items-center gap-3"><AdminLanguageSelector/><div className={locale==='ar'?'text-left':'text-right'}><div className="break-words">{staff.profile.full_name||staff.user.email}</div><div className="mt-1 text-white/55">{roleLabel(role)}</div></div><AdminLogout locale={locale}/></div></div></div><div className="container grid min-w-0 gap-4 py-4 sm:gap-5 sm:py-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-7 xl:py-7"><aside className="card h-fit min-w-0 overflow-x-auto p-2 lg:sticky lg:top-6 lg:overflow-visible"><div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest/40">{t.workspace}</div><nav className="flex min-w-max gap-1 lg:grid lg:min-w-0 lg:grid-cols-1">{navGroups.map(group=><section key={group.key} className="min-w-0"><h2 className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-forest/45">{locale==='ar'?group.ar:group.en}</h2><div className="grid gap-1">{group.items.map(item=><Link key={item.href} href={item.href} className="whitespace-nowrap rounded-xl px-3 py-2 text-sm text-forest transition hover:bg-[#f2eee3] hover:text-gold">{label(item)}</Link>)}</div></section>)}</nav></aside><div className="min-w-0 overflow-hidden">{children}</div></div></div>;
}