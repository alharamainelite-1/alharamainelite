export const dynamic='force-dynamic';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {InfluencerPartnerDetail} from '@/components/admin/InfluencerPartnerDetail';

export default async function PartnerDetail({params}:{params:Promise<{id:string}>}){
 const staff=await getCurrentStaff(); if(!staff||!['SUPER_ADMIN','ADMIN'].includes(staff.profile.role))return null;
 const {id}=await params; const s=getSupabaseAdmin();
 const [{data:partner},{data:commissions},{data:payouts},{data:customers},{data:directBookings}]=await Promise.all([
  s.from('influencer_partners').select('*').eq('id',id).maybeSingle(),
  s.from('influencer_commissions').select('*').eq('partner_id',id).order('created_at',{ascending:false}).limit(200),
  s.from('influencer_payouts').select('*').eq('partner_id',id).order('requested_at',{ascending:false}).limit(100),
  s.from('customers').select('id,full_name,whatsapp,influencer_partner_id').eq('influencer_partner_id',id),
  s.from('bookings').select('id,booking_id,customer_id,influencer_partner_id,status,payment_status,total_amount,currency,created_at').eq('influencer_partner_id',id).order('created_at',{ascending:false})
 ]);
 if(!partner)notFound();
 const customerRows=customers||[],customerIds=customerRows.map((c:any)=>c.id);
 const {data:customerBookings}=customerIds.length?await s.from('bookings').select('id,booking_id,customer_id,influencer_partner_id,status,payment_status,total_amount,currency,created_at').in('customer_id',customerIds).order('created_at',{ascending:false}):{data:[]};
 const customerMap=new Map(customerRows.map((c:any)=>[c.id,c]));
 const bookingMap=new Map([...(directBookings||[]),...(customerBookings||[])].map((b:any)=>[b.id,b]));
 const bookings=Array.from(bookingMap.values()).map((b:any)=>({...b,customer_name:customerMap.get(b.customer_id)?.full_name||'—',customer_whatsapp:customerMap.get(b.customer_id)?.whatsapp||''}));
 return <section className="pb-12"><Link href="/admin/influencer-partners" className="text-sm font-semibold text-gold">← شركاء المؤثرين</Link><div className="mt-5"><InfluencerPartnerDetail partner={partner} commissions={commissions||[]} payouts={payouts||[]} bookings={bookings} role={staff.profile.role}/></div></section>;
}
