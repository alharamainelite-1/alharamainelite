import { getSupabaseAdmin } from '@/lib/supabase/server';
import { BookingStatusForm } from '@/components/admin/BookingStatusForm';

export default async function BookingsPage() {
  let rows:any[]=[]; let error='';
  try {
    const {data,error:queryError}=await getSupabaseAdmin().from('bookings').select('id,booking_id,guest_count,total_amount,currency,status,payment_status,created_at,customers(full_name,whatsapp),packages(name)').order('created_at',{ascending:false}).limit(50);
    if(queryError) throw queryError; rows=data||[];
  } catch(e){error=e instanceof Error?e.message:'Unable to load bookings.';}
  return <section className="pb-12"><div><div className="eyebrow">Sales & finance</div><h1 className="serif mt-2 text-4xl text-forest">Bookings</h1><p className="mt-2 text-sm text-forest/55">Track booking lifecycle and payment status. A journey request is not a confirmed booking.</p></div>
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">Database: {error}</div>}
    <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-forest/10 bg-[#faf8f2]"><tr>{['Booking ID','Customer','Package','Guests','Total','Booking status','Payment','Created','Update'].map(h=><th key={h} className="px-4 py-4 font-semibold text-forest">{h}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={9} className="px-4 py-12 text-center text-forest/45">No bookings yet.</td></tr>:rows.map((row:any)=><tr key={row.id} className="border-b border-forest/8 last:border-0"><td className="px-4 py-4 font-semibold text-forest">{row.booking_id}</td><td className="px-4 py-4"><div className="font-semibold">{row.customers?.full_name||'—'}</div><div className="text-xs text-forest/45">{row.customers?.whatsapp||''}</div></td><td className="px-4 py-4">{row.packages?.name||'—'}</td><td className="px-4 py-4">{row.guest_count}</td><td className="px-4 py-4">{'$'}{Number(row.total_amount).toLocaleString()}</td><td className="px-4 py-4">{row.status}</td><td className="px-4 py-4">{row.payment_status}</td><td className="px-4 py-4 text-xs text-forest/45">{new Date(row.created_at).toLocaleDateString('en-GB')}</td><td className="px-4 py-4"><BookingStatusForm bookingId={row.id} currentStatus={row.status} paymentStatus={row.payment_status}/></td></tr>)}</tbody></table></div>
  </section>;
}
