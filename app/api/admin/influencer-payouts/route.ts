import {NextResponse} from 'next/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

export async function PATCH(req:Request){
 const staff=await getCurrentStaff(); if(!staff||staff.profile.role!=='SUPER_ADMIN')return NextResponse.json({error:'SUPER_ADMIN access required.'},{status:403});
 const b=await req.json().catch(()=>null) as any; if(!b?.id||!['PAID','REJECTED'].includes(b.status))return NextResponse.json({error:'Invalid payout update.'},{status:400});
 const s=getSupabaseAdmin(); const {data:payout}=await s.from('influencer_payouts').select('*').eq('id',b.id).single();
 if(!payout)return NextResponse.json({error:'Payout not found.'},{status:404});
 if(payout.status!=='REQUESTED')return NextResponse.json({error:'This payout is already processed.'},{status:409});
 if(b.status==='REJECTED'){
  const {data:after,error}=await s.from('influencer_payouts').update({status:'REJECTED',rejection_reason:String(b.reason||'Payment request rejected.').slice(0,1000)}).eq('id',b.id).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await s.from('influencer_commissions').update({payout_id:null}).eq('payout_id',b.id);
  return NextResponse.json({payout:after});
 }
 const paidAt=new Date().toISOString();
 const {data:after,error}=await s.from('influencer_payouts').update({status:'PAID',paid_at:paidAt}).eq('id',b.id).select('*').single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from('influencer_commissions').update({status:'PAID',paid_at:paidAt}).eq('payout_id',b.id);
 return NextResponse.json({payout:after});
}