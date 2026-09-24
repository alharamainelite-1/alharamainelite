import {NextResponse} from 'next/server';
import {getCurrentPartner} from '@/lib/supabase/partner';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {enforceRateLimit,rateLimitResponse} from '@/lib/security/rate-limit';

export async function POST(req:Request){
  const current=await getCurrentPartner();
  if(!current)return NextResponse.json({error:'Unauthorized.'},{status:401});
  if(!current.user.email_confirmed_at)return NextResponse.json({error:'Please verify your email before requesting a payout.'},{status:403});

  const limiter=await enforceRateLimit(req,'partner-payout',3,600,current.user.id);
  if(limiter.failed)return NextResponse.json({error:'Service temporarily unavailable. Please try again shortly.'},{status:503});
  if(!limiter.allowed)return rateLimitResponse(limiter.retryAfterSeconds);

  const s=getSupabaseAdmin();
  const {data,error}=await s.rpc('request_partner_payout',{p_partner_id:current.partner.id,p_actor_id:current.user.id});
  if(error){
    if(error.message.includes('minimum_payout_balance'))return NextResponse.json({error:'A minimum available balance of $500 is required.'},{status:400});
    if(error.message.includes('partner_not_eligible'))return NextResponse.json({error:'Your partner account is not eligible for payout requests.'},{status:403});
    console.error('partner_payout_error',error);
    return NextResponse.json({error:'Unable to create payout request.'},{status:500});
  }
  return NextResponse.json({payout:data?.[0]||null});
}
