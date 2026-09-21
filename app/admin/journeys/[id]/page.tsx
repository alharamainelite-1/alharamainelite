import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import Link from 'next/link';
import { BookingStatusForm } from '@/components/admin/BookingStatusForm';

export default async function JourneyFile({params}:{params:Promise<{id:string}>}){
  const staff=await getCurrentStaff(); if(!staff)return null;
  const {id}=await params;
  const s=getSupabaseAdmin();
  const {data:row,error}=await s.from('bookings').select('id,booking_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,notes,created_at,customers(full_name,country,city,whatsapp,email,preferred_language),packages(name,slug,positioning)').eq('id',id).single();
  if(error||!row)return <section className="pb-12"><div className="card p-10"><h1 className="serif text-3xl text-forest">Journey not found</h1><Link className="btn btn-outline mt-6" href="/admin/journeys">Back to journeys</Link></div></section>;
  const customer=row.customers; const pkg=row.packages;
  const period=row.expected_travel_date||row.expected_period_start||(row.expected_period_end?('Until '+row.expected_period_end):'Not set');
  const stage=['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED'].indexOf(row.status);
  const stages=['Request','Sales','Details','Payment','Verified','Confirmed','Preparing','Active','Completed'];
  return <section className="pb-12">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><Link href="/admin/journeys" className="text-sm font-semibold text-gold">← All journeys</Link><div className="eyebrow mt-5">{row.booking_id}</div><h1 className="serif mt-2 text-5xl text-forest">{customer?.full_name||'Unnamed customer'}</h1><p className="mt-2 text-forest/55">{pkg?.name||'—'} · {row.guest_count} guests · {period}</p></div>
      <BookingStatusForm bookingId={row.id} currentStatus={row.status} paymentStatus={row.payment_status}/>
    </div>
    <div className="card mt-8 overflow-x-auto p-5"><div className="flex min-w-[760px] items-center gap-2">{stages.map((x,i)=><div key={x} className="flex flex-1 items-center gap-2"><div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold '+(i<=stage?'bg-forest text-white':'bg-[#f7f3ea] text-forest/35')}>{i+1}</div><div className={'text-xs font-semibold '+(i<=stage?'text-forest':'text-forest/35')}>{x}</div>{i<stages.length-1&&<div className={'h-px flex-1 '+(i<stage?'bg-gold':'bg-forest/10')}/>}</div>)}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <div className="grid gap-6">
        <div className="card p-6"><div className="eyebrow">Customer</div><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><div className="text-xs text-forest/40">Name</div><div className="mt-1 font-semibold text-forest">{customer?.full_name||'—'}</div></div><div><div className="text-xs text-forest/40">WhatsApp</div><div className="mt-1 font-semibold text-forest">{customer?.whatsapp||'—'}</div></div><div><div className="text-xs text-forest/40">Country / City</div><div className="mt-1 font-semibold text-forest">{customer?.country||'—'} {customer?.city?'· '+customer.city:''}</div></div><div><div className="text-xs text-forest/40">Language</div><div className="mt-1 font-semibold uppercase text-forest">{customer?.preferred_language||'—'}</div></div></div></div>
        <div className="card p-6"><div className="eyebrow">Journey details</div><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><div className="text-xs text-forest/40">Package</div><div className="mt-1 text-xl font-semibold text-forest">{pkg?.name||'—'}</div></div><div><div className="text-xs text-forest/40">Expected travel</div><div className="mt-1 font-semibold text-forest">{period}</div></div><div><div className="text-xs text-forest/40">Guests</div><div className="mt-1 font-semibold text-forest">{row.guest_count}</div></div><div><div className="text-xs text-forest/40">Notes</div><div className="mt-1 text-sm leading-6 text-forest/65">{row.notes||'No notes yet.'}</div></div></div></div>
        <div className="card p-6"><div className="eyebrow">Operations readiness</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">Hotels</b><div className="mt-1 text-xs text-forest/50">Open Operations to confirm Makkah & Madinah.</div></div><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">Transportation</b><div className="mt-1 text-xs text-forest/50">Transfers and vehicles.</div></div><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">Train</b><div className="mt-1 text-xs text-forest/50">Haramain Train where applicable.</div></div><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">Ziyarat / Host</b><div className="mt-1 text-xs text-forest/50">Assignments and readiness.</div></div></div><Link href="/admin/operations" className="btn btn-outline mt-5">Open Operations Control Center</Link></div>
      </div>
      <div className="grid h-fit gap-6">
        <div className="card p-6"><div className="eyebrow">Financial</div><div className="mt-4"><div className="text-xs text-forest/40">Journey value</div><div className="serif mt-1 text-4xl text-forest">$ {Number(row.total_amount).toLocaleString()}</div><div className="mt-4 flex items-center justify-between border-t border-forest/10 pt-4"><span className="text-sm text-forest/55">Payment</span><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{row.payment_status.replaceAll('_',' ')}</span></div></div><Link href="/admin/payments" className="btn btn-outline mt-5 w-full">Open payments</Link></div>
        <div className="card p-6"><div className="eyebrow">Communication</div><p className="mt-4 text-sm leading-6 text-forest/60">Keep customer communication attached to the journey so Sales and Operations see the same context.</p>{customer?.whatsapp&&<a className="btn btn-primary mt-5 w-full" href={'https://wa.me/'+customer.whatsapp.replace(/[^0-9]/g,'')} target="_blank" rel="noreferrer">Open WhatsApp</a>}</div>
      </div>
    </div>
  </section>
}