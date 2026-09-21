import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import Link from 'next/link';

export default async function JourneysPage(){
  const staff=await getCurrentStaff();
  if(!staff)return null;
  let rows:any[]=[]; let error='';
  try{
    const {data,error:e}=await getSupabaseAdmin().from('bookings').select('id,booking_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,created_at,customers(full_name,country,whatsapp),packages(name,slug)').order('created_at',{ascending:false}).limit(100);
    if(e)throw e; rows=data||[];
  }catch(e){error=e instanceof Error?e.message:'Unable to load journeys.'}
  const open=rows.filter(r=>!['COMPLETED','CANCELLED'].includes(r.status));
  return <section className="pb-12">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><div className="eyebrow">Journey workspace</div><h1 className="serif mt-2 text-4xl text-forest">Journeys</h1><p className="mt-2 max-w-2xl text-sm text-forest/55">One place for the customer, package, payment and operational readiness of every journey.</p></div>
      <div className="rounded-xl bg-white px-4 py-3 text-sm text-forest shadow-sm"><span className="font-semibold">${open.length}</span> active journeys</div>
    </div>
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    <div className="mt-8 grid gap-4">
      {rows.length===0?<div className="card p-12 text-center text-forest/45">No journeys yet.</div>:rows.map(r=>{
        const period=r.expected_travel_date||r.expected_period_start||(r.expected_period_end?('Until '+r.expected_period_end):'Not set');
        return <Link key={r.id} href={'/admin/journeys/'+r.id} className="card group p-6 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.7fr_.7fr_.9fr_auto] lg:items-center">
            <div><div className="text-xs font-semibold tracking-wider text-gold">${r.booking_id}</div><div className="mt-1 text-lg font-semibold text-forest">${r.customers?.full_name||'Unnamed customer'}</div><div className="mt-1 text-sm text-forest/50">${r.customers?.country||'Country not set'} · ${r.guest_count} guests</div></div>
            <div><div className="text-xs text-forest/40">Journey</div><div className="mt-1 font-semibold text-forest">${r.packages?.name||'—'}</div><div className="text-xs text-forest/50">${period}</div></div>
            <div><div className="text-xs text-forest/40">Value</div><div className="mt-1 font-semibold text-forest">$${Number(r.total_amount).toLocaleString()}</div><div className="text-xs text-forest/50">${r.payment_status.replaceAll('_',' ')}</div></div>
            <div><div className="text-xs text-forest/40">Journey stage</div><div className="mt-2 inline-flex rounded-full bg-[#f7f3ea] px-3 py-1.5 text-xs font-semibold text-forest">${r.status.replaceAll('_',' ')}</div></div>
            <div className="text-sm font-semibold text-gold group-hover:translate-x-1 transition">Open →</div>
          </div>
        </Link>
      })}
    </div>
  </section>
}