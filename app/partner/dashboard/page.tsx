export const dynamic='force-dynamic';
import {redirect} from 'next/navigation';
import{getSupabaseAdmin}from'@/lib/supabase/server';
import{getCurrentPartner}from'@/lib/supabase/partner';
import{PartnerDashboardClient}from'@/components/partner/PartnerDashboardClient';

export default async function PartnerDashboardPage(){
 const current=await getCurrentPartner();
 if(!current)redirect('/partner-login');
 const s=getSupabaseAdmin();
 const[{data:rows},{data:payouts},{data:referredBookings}]=await Promise.all([
  s.from('influencer_commissions').select('id,booking_id,type,amount,available_at,status,payout_id,created_at').eq('partner_id',current.partner.id).order('created_at',{ascending:false}).limit(200),
  s.from('influencer_payouts').select('id,amount,status,rejection_reason,requested_at,paid_at').eq('partner_id',current.partner.id).order('requested_at',{ascending:false}).limit(20),
  s.from('bookings').select('id,booking_id,guest_count,status,payment_status,total_amount,currency,created_at').eq('influencer_partner_id',current.partner.id).order('created_at',{ascending:false}).limit(200)
 ]);
 const now=Date.now();
 const ledger=rows||[];
 const eligible=ledger.filter((x:any)=>x.payout_id===null&&x.status==='PENDING'&&new Date(x.available_at).getTime()<=now);
 const available=eligible.reduce((n:number,x:any)=>n+(x.type==='RECOVERY'?-Number(x.amount):Number(x.amount)),0);
 const pending=ledger.filter((x:any)=>x.payout_id===null&&x.status==='PENDING'&&new Date(x.available_at).getTime()>now).reduce((n:number,x:any)=>n+(x.type==='RECOVERY'?-Number(x.amount):Number(x.amount)),0);
 const bookings=referredBookings||[];
 const paid=(payouts||[]).filter((x:any)=>x.status==='PAID').reduce((n:number,x:any)=>n+Number(x.amount),0);

 function commissionForBooking(b:any){
  const c=ledger.find((x:any)=>x.booking_id===b.id&&x.type==='COMMISSION');
  if(c){
   if(c.status==='PAID')return {amount:Number(c.amount),label:'Paid'};
   if(c.status==='REVERSED')return {amount:0,label:'Reversed'};
   if(c.status==='PENDING'&&new Date(c.available_at).getTime()<=now)return {amount:Number(c.amount),label:'Available'};
   return {amount:Number(c.amount),label:'Pending'};
  }
  if(b.status==='CANCELLED')return {amount:0,label:'Cancelled'};
  return {amount:0,label:b.payment_status==='RECEIVED'?'Processing':'Pending payment'};
 }

 const labels={
  booking:'Booking',
  guests:'Guests',
  status:'Booking status',
  payment:'Payment status',
  commission:'Commission',
  noBookings:'No referred bookings yet.',
  pendingPayment:'Pending payment',
  processing:'Processing',
  available:'Available',
  paid:'Paid',
  reversed:'Reversed',
  cancelled:'Cancelled'
 };

 return <main className="min-h-screen bg-ivory"><section className="section"><div className="container max-w-6xl">
  <div className="flex flex-wrap items-end justify-between gap-5">
   <div><div className="eyebrow">ALHARAMAIN ELITE Partner Program</div><h1 className="serif mt-3 text-5xl text-forest">Welcome, {current.partner.full_name.split(' ')[0]}.</h1><p className="mt-3 text-forest/55">Your referral link and commission status.</p></div>
   <PartnerDashboardClient available={available}/>
  </div>
  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   <div className="card p-6"><div className="eyebrow">Referred Bookings</div><div className="serif mt-2 text-4xl text-forest">{bookings.length}</div></div>
   <div className="card p-6"><div className="eyebrow">Pending Commission</div><div className="serif mt-2 text-4xl text-forest">$ {Math.max(0,pending).toLocaleString()}</div><p className="mt-2 text-xs text-forest/45">After verified payment</p></div>
   <div className="card p-6"><div className="eyebrow">Commission Available</div><div className="serif mt-2 text-4xl text-forest">$ {Math.max(0,available).toLocaleString()}</div><p className="mt-2 text-xs text-forest/45">Ready for payout · $500 minimum</p></div>
   <div className="card p-6"><div className="eyebrow">Commission Paid</div><div className="serif mt-2 text-4xl text-forest">$ {paid.toLocaleString()}</div></div>
  </div>
  <div className="mt-8 card overflow-hidden">
   <div className="border-b border-forest/10 p-6"><div className="eyebrow">Referral bookings</div><p className="mt-2 text-sm text-forest/50">Only the information needed to follow your referrals and commission is shown.</p></div>
   {bookings.length===0?<div className="p-8 text-sm text-forest/45">{labels.noBookings}</div>:<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr><th className="px-5 py-4">{labels.booking}</th><th className="px-5 py-4">{labels.guests}</th><th className="px-5 py-4">{labels.status}</th><th className="px-5 py-4">{labels.payment}</th><th className="px-5 py-4">{labels.commission}</th></tr></thead><tbody>{bookings.map((b:any)=>{const c=commissionForBooking(b);return <tr key={b.id} className="border-t border-forest/10"><td className="px-5 py-4 font-semibold text-forest">{b.booking_id}</td><td className="px-5 py-4">{b.guest_count}</td><td className="px-5 py-4">{String(b.status||'—').replaceAll('_',' ')}</td><td className="px-5 py-4">{String(b.payment_status||'—').replaceAll('_',' ')}</td><td className="px-5 py-4 font-semibold text-forest">{c.label==='Reversed'?'—':'$ '+c.amount.toLocaleString()}<div className="mt-1 text-xs font-normal text-forest/45">{c.label}</div></td></tr>})}</tbody></table></div>}
  </div>
  <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
   <div className="card p-7"><div className="eyebrow">Your referral link</div><div className="mt-4 break-all rounded-xl bg-[#f7f3ea] p-4 font-semibold text-forest">{process.env.NEXT_PUBLIC_SITE_URL||'https://alharamainelite.vercel.app'}/{current.partner.slug}</div><p className="mt-3 text-sm text-forest/50">Share this link with your audience.</p></div>
   <div className="card p-7"><div className="eyebrow">Partner status</div><div className="mt-3 inline-flex rounded-full bg-[#f7f3ea] px-4 py-2 text-sm font-semibold text-forest">{current.partner.status}</div></div>
  </div>
  
 </div></section></main>
}