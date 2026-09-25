export const dynamic='force-dynamic';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {InfluencerPartnersAdmin} from '@/components/admin/InfluencerPartnersAdmin';

export default async function InfluencerPartnersPage(){
 const staff=await getCurrentStaff(); if(!staff||!['SUPER_ADMIN','ADMIN'].includes(staff.profile.role))redirect('/admin');
 const s=getSupabaseAdmin();
 const [{data:partners},{data:commissions},{data:payouts}]=await Promise.all([
  s.from('influencer_partners').select('*').order('created_at',{ascending:false}),
  s.from('influencer_commissions').select('partner_id,booking_id,type,amount,status,available_at,payout_id,created_at').order('created_at',{ascending:false}),
  s.from('influencer_payouts').select('id,partner_id,amount,status,rejection_reason,requested_at,paid_at').order('requested_at',{ascending:false})
 ]);
 const ps=partners||[],cs=commissions||[],pay=payouts||[];
 const rows=ps.map((p:any)=>{
  const pc=cs.filter((c:any)=>c.partner_id===p.id);
  const bookings=new Set(pc.filter((c:any)=>c.type==='COMMISSION').map((c:any)=>c.booking_id)).size;
  const sales=pc.filter((c:any)=>c.type==='COMMISSION').reduce((n:number,c:any)=>n+Number(c.amount)/0.05,0);
  const due=pc.filter((c:any)=>c.status==='PENDING'&&c.payout_id===null&&new Date(c.available_at).getTime()<=Date.now()).reduce((n:number,c:any)=>n+(c.type==='RECOVERY'?-Number(c.amount):Number(c.amount)),0);
  const paid=pay.filter((x:any)=>x.partner_id===p.id&&x.status==='PAID').reduce((n:number,x:any)=>n+Number(x.amount),0);
  return {...p,bookings,sales,due,paid};
 }).sort((a:any,b:any)=>b.sales-a.sales);
 return <section className="pb-12">
  <div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-2 text-4xl text-forest">شركاء المؤثرين</h1><p className="mt-2 max-w-2xl text-forest/55">إحالات الشركاء والمبيعات والعمولات وطلبات الصرف.</p></div><Link href="/admin" className="btn btn-outline">العودة إلى لوحة التحكم</Link></div>
  <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['إجمالي الشركاء',ps.length],['نشطون',ps.filter((p:any)=>p.status==='ACTIVE').length],['معلقون',ps.filter((p:any)=>p.status==='PENDING').length],['طلبات الصرف',pay.filter((p:any)=>p.status==='REQUESTED').length]].map(([l,v])=><div className="card p-6" key={String(l)}><div className="eyebrow">{l}</div><div className="serif mt-2 text-4xl text-forest">{v}</div></div>)}</div>
  <div className="mt-7"><InfluencerPartnersAdmin initialRows={rows} payouts={pay} role={staff.profile.role}/></div>
 </section>;
}