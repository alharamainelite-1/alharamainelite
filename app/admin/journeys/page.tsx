import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import Link from 'next/link'; import {getAdminLocale} from '@/lib/admin-locale'; import {adminText} from '@/lib/admin-text';

export default async function JourneysPage(){ const locale=await getAdminLocale(); const t=adminText[locale];
  const staff=await getCurrentStaff();
  if(!staff)return null;
  const canViewFinancial=staff.profile.role==='SUPER_ADMIN'||staff.profile.role==='FINANCE';
  let rows:any[]=[]; let error='';
  try{
    const {data,error:e}=await getSupabaseAdmin().from('bookings').select('id,booking_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,created_at,customers(full_name,country,whatsapp),packages(name,slug)').order('created_at',{ascending:false}).limit(100);
    if(e)throw e; rows=data||[];
  }catch(e){error=e instanceof Error?e.message:'Unable to load journeys.'}
  const open=rows.filter(r=>!['COMPLETED','CANCELLED'].includes(r.status));
  return <section className="pb-12">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><div className="eyebrow">{t.journeyWorkspace}</div><h1 className="serif mt-2 text-4xl text-forest">{t.journeys}</h1><p className="mt-2 max-w-2xl text-sm text-forest/55">{t.journeyWorkspaceDesc}</p></div>
      <div className="rounded-xl bg-white px-4 py-3 text-sm text-forest shadow-sm"><span className="font-semibold">{open.length}</span> {t.activeCount}</div>
    </div>
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    <div className="mt-8 grid gap-4">
      {rows.length===0?<div className="card p-12 text-center text-forest/45">{t.noJourneys}</div>:rows.map(r=>{
        const period=r.expected_travel_date||r.expected_period_start||(r.expected_period_end?((locale==='ar'?'حتى ':'Until ')+r.expected_period_end):(locale==='ar'?'غير محدد':'Not set'));
        return <Link key={r.id} href={'/admin/journeys/'+r.id} className="card group p-6 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.7fr_.7fr_.9fr_auto] lg:items-center">
            <div><div className="text-xs font-semibold tracking-wider text-gold">{r.booking_id}</div><div className="mt-1 text-lg font-semibold text-forest">{r.customers?.full_name||(locale==='ar'?'عميل بدون اسم':'Unnamed customer')}</div><div className="mt-1 text-sm text-forest/50">{r.customers?.country||t.notSet} · {r.guest_count} guests</div></div>
            <div><div className="text-xs text-forest/40">Journey</div><div className="mt-1 font-semibold text-forest">{r.packages?.name||'—'}</div><div className="text-xs text-forest/50">{period}</div></div>
            <div><div className="text-xs text-forest/40">Status</div><div className="mt-1 font-semibold text-forest">{r.status.replaceAll('_',' ')}</div>{canViewFinancial&&<div className="text-xs text-forest/50">{r.payment_status.replaceAll('_',' ')}</div>}</div>
            <div><div className="text-xs text-forest/40">{t.stage}</div><div className="mt-2 inline-flex rounded-full bg-[#f7f3ea] px-3 py-1.5 text-xs font-semibold text-forest">${r.status.replaceAll('_',' ')}</div></div>
            <div className="text-sm font-semibold text-gold group-hover:translate-x-1 transition">{t.open}</div>
          </div>
        </Link>
      })}
    </div>
  </section>
}