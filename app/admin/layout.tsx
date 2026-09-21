import Link from 'next/link';
import { cookies } from 'next/headers';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import { AdminTranslator } from '@/components/admin/AdminTranslator';
const nav:Array<[string,string]>=[['Dashboard','/admin'],['Audit Logs','/admin/audit-logs'],['Journey Requests','/admin/requests'],['Bookings','/admin/bookings'],['Groups','/admin/groups'],['Guests','/admin/guests'],['Operations','/admin/operations'],['Hosts','/admin/hosts'],['Hotels','/admin/hotels'],['Transportation','/admin/transportation'],['Train','/admin/train'],['Payments','/admin/payments'],['Expenses','/admin/expenses'],['Reviews','/admin/reviews'],['Communications','/admin/communications'],['Reports','/admin/reports'],['Settings','/admin/settings']];
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const staff=await getCurrentStaff(); if(!staff)return <>{children}</>;
 const locale=(await cookies()).get('he_locale')?.value==='ar'?'ar':'en';
 return <div data-admin-translator dir={locale==='ar'?'rtl':'ltr'} lang={locale} className="min-h-screen bg-[#f3f0e7]"><AdminTranslator/>
 <div className="border-b border-forest/10 bg-forest text-white"><div className="container flex min-h-16 items-center justify-between gap-4">
 <Link href="/admin" className="font-semibold tracking-wide">ALHARAMAINELITE <span className="text-gold">/ ADMIN</span></Link>
 <div className="flex items-center gap-3"><AdminLanguageSelector/><div className={locale==='ar'?'text-left text-xs':'text-right text-xs'}><div>{staff.profile.full_name||staff.user.email}</div><div className="mt-1 text-white/55">{staff.profile.role}</div></div><AdminLogout/></div>
 </div></div>
 <div className="container grid gap-6 py-6 lg:grid-cols-[220px_1fr]"><aside className="card h-fit p-3 lg:sticky lg:top-6"><nav className="grid gap-1">{nav.map(([label,href])=><Link key={href} href={href} className="px-3 py-2 text-sm text-forest transition hover:bg-[#f2eee3] hover:text-gold">{label}</Link>)}</nav></aside><div>{children}</div></div></div>;
}