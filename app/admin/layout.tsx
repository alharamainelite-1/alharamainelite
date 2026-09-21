import Link from 'next/link';
import { cookies } from 'next/headers';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
const nav:{en:string;ar:string;href:string}[]=[
{en:'Dashboard',ar:'لوحة التحكم',href:'/admin'},{en:'Audit Logs',ar:'سجلات التدقيق',href:'/admin/audit-logs'},{en:'Journey Requests',ar:'طلبات الرحلات',href:'/admin/requests'},{en:'Bookings',ar:'الحجوزات',href:'/admin/bookings'},{en:'Groups',ar:'المجموعات',href:'/admin/groups'},{en:'Guests',ar:'الضيوف',href:'/admin/guests'},{en:'Operations',ar:'العمليات',href:'/admin/operations'},{en:'Hosts',ar:'المضيفون',href:'/admin/hosts'},{en:'Hotels',ar:'الفنادق',href:'/admin/hotels'},{en:'Transportation',ar:'النقل',href:'/admin/transportation'},{en:'Train',ar:'القطار',href:'/admin/train'},{en:'Payments',ar:'المدفوعات',href:'/admin/payments'},{en:'Expenses',ar:'المصروفات',href:'/admin/expenses'},{en:'Reviews',ar:'التقييمات',href:'/admin/reviews'},{en:'Communications',ar:'التواصل',href:'/admin/communications'},{en:'Reports',ar:'التقارير',href:'/admin/reports'},{en:'Settings',ar:'الإعدادات',href:'/admin/settings'}];
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const staff=await getCurrentStaff(); if(!staff)return <>{children}</>;
 const locale=(await cookies()).get('he_locale')?.value==='ar'?'ar':'en'; const label=(x:{en:string;ar:string})=>locale==='ar'?x.ar:x.en;
 return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="min-h-screen bg-[#f3f0e7]">
 <div className="border-b border-forest/10 bg-forest text-white"><div className="container flex min-h-16 items-center justify-between gap-4"><Link href="/admin" className="font-semibold tracking-wide">ALHARAMAINELITE <span className="text-gold">/ ADMIN</span></Link><div className="flex items-center gap-3"><AdminLanguageSelector/><div className={locale==='ar'?'text-left text-xs':'text-right text-xs'}><div>{staff.profile.full_name||staff.user.email}</div><div className="mt-1 text-white/55">{staff.profile.role}</div></div><AdminLogout/></div></div></div>
 <div className="container grid gap-6 py-6 lg:grid-cols-[220px_1fr]"><aside className="card h-fit p-3 lg:sticky lg:top-6"><nav className="grid gap-1">{nav.map(item=><Link key={item.href} href={item.href} className="px-3 py-2 text-sm text-forest transition hover:bg-[#f2eee3] hover:text-gold">{label(item)}</Link>)}</nav></aside><div>{children}</div></div></div>;
}