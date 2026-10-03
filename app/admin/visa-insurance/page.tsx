import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {VisaInsuranceStatusForm} from '@/components/admin/VisaInsuranceStatusForm';
import {redirect} from 'next/navigation';
const ROLES=['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES'];
export default async function VisaInsurancePage(){
 const staff=await getCurrentStaff();if(!staff)redirect('/admin/login');if(!ROLES.includes(staff.profile.role))return <section className="card p-8">Access restricted.</section>;
 const s=getSupabaseAdmin();
 const {data:bookings,error}=await s.from('bookings').select('id,booking_id,guest_count,status,expected_travel_date,expected_period_start,expected_period_end,customers(full_name,country)').is('archived_at',null).order('created_at',{ascending:false}).limit(200);
 const ids=(bookings||[]).map(b=>b.id);
 const {data:travel,error:travelError}=ids.length?await s.from('booking_travel_admin').select('*').in('booking_id',ids):{data:[],error:null} as any;
 const travelMap=new Map<string,any>();(travel||[]).forEach((x:any)=>travelMap.set(x.booking_id,x));
 return <section className="pb-12"><div className="eyebrow">Guest Services</div><h1 className="serif mt-2 text-4xl text-forest">Visa & Health Insurance</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-forest/60">Track visa and travel health insurance progress for each booking. Collect guest details separately during follow-up; do not enter passport numbers or upload identity documents here.</p>
 {(error||travelError)&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load all records. Check that the travel tracking migration has been applied.</div>}
 <div className="mt-6 grid gap-4">{!bookings?.length?<div className="card p-8 text-center text-forest/50">No active bookings found.</div>:bookings.map((b:any)=><article key={b.id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold tracking-wider text-gold">{b.booking_id}</div><h2 className="mt-1 text-lg font-semibold text-forest">{b.customers?.full_name||'Customer name pending'}</h2><p className="mt-1 text-xs text-forest/50">{[b.customers?.country,b.status?.replaceAll('_',' ')].filter(Boolean).join(' · ')}</p></div><div className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs text-forest">{b.expected_travel_date||[b.expected_period_start,b.expected_period_end].filter(Boolean).join(' – ')||'Travel date pending'} · {b.guest_count} guest(s)</div></div>
 <VisaInsuranceStatusForm bookingId={b.id} initial={travelMap.get(b.id)||null}/></article>)}</div>
 </section>
}