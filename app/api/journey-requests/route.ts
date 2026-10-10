import {NextResponse} from 'next/server';
import {journeyRequestSchema} from '@/lib/validation/journey';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {enforceRateLimit,rateLimitResponse} from '@/lib/security/rate-limit';
export async function POST(req:Request){
 try{
  const raw=await req.json();if(JSON.stringify(raw).length>15000)return NextResponse.json({error:'Request is too large.'},{status:413});
  const parsed=journeyRequestSchema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:'Please check the highlighted details.',issues:parsed.error.flatten().fieldErrors},{status:400});
  const v=parsed.data;const partnerSlug=req.headers.get('cookie')?.match(/(?:^|; )he_partner_ref=([^;]+)/)?.[1]||null;
  if(v.website)return NextResponse.json({error:'Please check the highlighted details.'},{status:400});
  const ipLimit=await enforceRateLimit(req,'journey-request',10,60);if(ipLimit.failed)return NextResponse.json({error:'Service temporarily unavailable. Please try again shortly.'},{status:503});if(!ipLimit.allowed)return rateLimitResponse(ipLimit.retryAfterSeconds);
  if(v.email){const emailLimit=await enforceRateLimit(req,'journey-request-email',5,600,v.email);if(emailLimit.failed)return NextResponse.json({error:'Service temporarily unavailable. Please try again shortly.'},{status:503});if(!emailLimit.allowed)return rateLimitResponse(emailLimit.retryAfterSeconds);}
  const {data,error}=await getSupabaseAdmin().rpc('create_journey_request',{
   p_full_name:v.fullName,p_whatsapp:v.whatsapp,p_idempotency_key:v.idempotencyKey,p_email:v.email||null,p_country:v.country,p_city:v.city||null,p_preferred_language:v.preferredLanguage,
   p_package_slug:v.packageSlug,p_guest_count:v.guestCount,p_departure_id:v.departureId,
   p_expected_travel_date:v.expectedTravelDate||null,p_expected_period_start:v.expectedPeriodStart||null,
   p_expected_period_end:v.expectedPeriodEnd||null,p_expected_period_label:v.expectedPeriodLabel||null,
   p_additional_notes:v.additionalNotes||null,p_lead_source:v.leadSource,p_partner_slug:partnerSlug
  });
  if(error||!data){console.error('journey_request_rpc_error',error);if(error?.message?.includes('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'))return NextResponse.json({error:'This request key was already used with different details. Refresh the form and try again.'},{status:409});return NextResponse.json({error:'We could not receive your request right now. Please try again.'},{status:500});}
  const row=Array.isArray(data)?data[0]:data;
  if(!row?.reference||!row?.booking_id||row?.estimated_total==null||!row?.currency||!row?.departure_date)return NextResponse.json({error:'We could not complete your request right now. Please try again.'},{status:500});
  return NextResponse.json({reference:row.reference,bookingId:row.booking_id,total:Number(row.estimated_total),currency:row.currency,departureDate:row.departure_date,replayed:row.idempotency_replayed===true},{status:row.idempotency_replayed===true?200:201});
 }catch(error){console.error('journey_request_error',error);return NextResponse.json({error:'We could not receive your request right now. Please try again.'},{status:500});}
}