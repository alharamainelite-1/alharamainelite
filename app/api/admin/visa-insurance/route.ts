import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
const ROLES=['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES'];
const VISA=['NOT_STARTED','DOCUMENTS_PENDING','SUBMITTED','UNDER_REVIEW','ISSUED','REJECTED','NOT_REQUIRED'];
const INSURANCE=['NOT_STARTED','PENDING','ISSUED','NOT_REQUIRED'];
async function authorized(){const staff=await getCurrentStaff();if(!staff)return {staff:null,response:NextResponse.json({error:'Unauthorized.'},{status:401})};if(!ROLES.includes(staff.profile.role))return {staff,response:NextResponse.json({error:'Access denied.'},{status:403})};return {staff,response:null};}
export async function GET(){
 const {response}=await authorized();if(response)return response;
 const s=getSupabaseAdmin();
 const {data:bookings,error}=await s.from('bookings').select('id,booking_id,guest_count,status,expected_travel_date,expected_period_start,expected_period_end,customers(full_name,country)').is('archived_at',null).order('created_at',{ascending:false}).limit(200);
 if(error)return NextResponse.json({error:'Unable to load bookings.'},{status:500});
 const ids=(bookings||[]).map(b=>b.id);
 const {data:travel,error:travelError}=ids.length?await s.from('booking_guest_travel_admin').select('*').in('booking_id',ids):{data:[],error:null} as any;
 if(travelError)return NextResponse.json({error:'Unable to load travel records.'},{status:500});
 return NextResponse.json({bookings:bookings||[],travel:travel||[]});
}
export async function PATCH(req:Request){
 const {staff,response}=await authorized();if(response)return response;
 const b=await req.json().catch(()=>null) as any;
 const guestNumber=Number(b?.guest_number);
 if(!b?.booking_id||!Number.isInteger(guestNumber)||guestNumber<1||guestNumber>8||!VISA.includes(b.visa_status)||!INSURANCE.includes(b.insurance_status))return NextResponse.json({error:'Invalid guest travel status.'},{status:400});
 const visaRef=String(b.visa_reference||'').trim(),insuranceRef=String(b.insurance_reference||'').trim(),notes=String(b.internal_notes||'').trim();
 if(visaRef.length>160||insuranceRef.length>160||notes.length>3000)return NextResponse.json({error:'One or more fields exceed the allowed length.'},{status:400});
 const s=getSupabaseAdmin();
 const {data:booking,error:bookingError}=await s.from('bookings').select('id,guest_count').eq('id',b.booking_id).is('archived_at',null).maybeSingle();
 if(bookingError||!booking||guestNumber>booking.guest_count)return NextResponse.json({error:'Booking or guest slot not found.'},{status:404});
 const {data:before}=await s.from('booking_guest_travel_admin').select('*').eq('booking_id',booking.id).eq('guest_number',guestNumber).maybeSingle();
 const values={booking_id:booking.id,guest_number:guestNumber,visa_status:b.visa_status,visa_reference:visaRef||null,visa_expiry_date:b.visa_expiry_date||null,insurance_status:b.insurance_status,insurance_reference:insuranceRef||null,insurance_expiry_date:b.insurance_expiry_date||null,internal_notes:notes||null,updated_by:staff!.profile.id,updated_at:new Date().toISOString()};
 const {data,error}=await s.from('booking_guest_travel_admin').upsert(values,{onConflict:'booking_id,guest_number'}).select('*').single();
 if(error)return NextResponse.json({error:'Unable to save travel administration status.'},{status:500});
 await s.from('audit_logs').insert({actor_id:staff!.profile.id,action:'GUEST_TRAVEL_STATUS_UPDATED',entity_type:'booking_guest_travel_admin',entity_id:data.id,before_data:before||null,after_data:data});
 revalidatePath('/admin/visa-insurance');return NextResponse.json({travel:data});
}
