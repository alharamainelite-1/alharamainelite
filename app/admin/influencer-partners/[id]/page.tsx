import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {InfluencerPartnerDetail} from '@/components/admin/InfluencerPartnerDetail';

export default async function PartnerDetail({params}:{params:Promise<{id:string}>}){
 const staff=await getCurrentStaff(); if(!staff||!['SUPER_ADMIN','ADMIN'].includes(staff.profile.role))return null;
 const {id}=await params; const s=getSupabaseAdmin();
 const [{data:partner},{data:commissions},{data:payouts}]=await Promise.all([
  s.from('influencer_partners').select('*').eq('id',id).maybeSingle(),
  s.from('influencer_commissions').select('*').eq('partner_id',id).order('created_at',{ascending:false}).limit(200),
  s.from('influencer_payouts').select('*').eq('partner_id',id).order('requested_at',{ascending:false}).limit(100)
 ]);
 if(!partner)notFound();
 return <section className="pb-12"><Link href="/admin/influencer-partners" className="text-sm font-semibold text-gold">← Influencer Partners</Link><div className="mt-5"><InfluencerPartnerDetail partner={partner} commissions={commissions||[]} payouts={payouts||[]} role={staff.profile.role}/></div></section>;
}