import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {VisaInsuranceStatusForm} from '@/components/admin/VisaInsuranceStatusForm';
import {redirect} from 'next/navigation';
const ROLES=['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES'];
export default async function VisaInsurancePage(){
 const staff=await getCurrentStaff();if(!staff)redirect('/admin/login');if(!ROLES.includes(staff.profile.role))return <section className="card p-8">Access restricted.</section>;
 const s=getSupabaseAdmin();
 const {data:guests,error}=await s.from('booking_guests').select('id,booking_id,full_name,email,country').order('created_at',{ascending:false}).limit(500);
 const ids=[...new Set((guests||[]).map(g=>g.booking_id))];
 const [bookings,statuses]=await Promise.all([
  ids.length?s.from('bookings').select('id,booking_id,status,expected_travel_date,expected_period_start,expected_period_end').in('id',ids):Promise.resolve({data:[],error:null} as any),
  guests?.length?s.from('booking_guest_travel_admin').select('booking_guest_id,visa_status,visa_reference,visa_expiry_date,insurance_status,insurance_reference,insurance_expiry_date,internal_notes,updated_at').in('booking_guest_id',guests.map(g=>g.id)):Promise.resolve({data:[],error:null} as any)
 ]);
 const bookingMap=new Map((bookings.data||[]).map((b:any)=>[b.id,b]));
 const statusMap=new Map((statuses.data||[]).map((x:any)=>[x.booking_guest_id,x]));
 return <section className="pb-12"><div className="eyebrow">Guest Services</div><h1 className="serif mt-2 text-4xl text-forest">Visa & Health Insurance</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-forest/60">Track visa processing and travel health insurance for each booked guest. Store status and reference details only; do not enter passport numbers or upload identity documents here.</p>
 {(error||bookings.error||statuses.error)&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load all records. Check the travel tracking migration and database permissions.</div>}
 <div className="mt-6 grid gap-4">{!guests?.length?<div className="card p-8 text-center text-forest/50">No individual guest records are available yet. Guest-level tracking requires booking guest records.</div>:guests.map(g=>{const b:any=bookingMap.get(g.booking_id);return <article key={g.id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold tracking-wider text-gold">{b?.booking_id||'Booking'}</div><h2 className="mt-1 text-lg font-semibold text-forest">{g.full_name||'Guest name pending'}</h2><p className="mt-1 text-xs text-forest/50">{[g.country,g.email].filter(Boolean).join(' · ')||'No additional guest details'}</p></div><div className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs text-forest">{b?.status?.replaceAll('_',' ')||'—'}{b?.expected_travel_date?' · '+b.expected_travel_date:''}</div></div><VisaInsuranceStatusForm guestId={g.id} initial={statusMap.get(g.id)||null}/></article>})}</div>
 </section>
}
