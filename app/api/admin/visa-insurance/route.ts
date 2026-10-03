import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
const ROLES=['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES'];
const VISA=['NOT_STARTED','DOCUMENTS_PENDING','SUBMITTED','UNDER_REVIEW','ISSUED','REJECTED','NOT_REQUIRED'];
const INSURANCE=['NOT_STARTED','PENDING','ISSUED','NOT_REQUIRED'];
async function authorized(){const staff=await getCurrentStaff();if(!staff)return {staff:null,response:NextResponse.json({error:'Unauthorized.'},{status:401})};if(!ROLES.includes(staff.profile.role))return {staff,response:NextResponse.json({error:'Access denied.'},{status:403})};return {staff,response:null};}
export async function PATCH(req:Request){
 const {staff,response}=await authorized();if(response)return response;
 const b=await req.json().catch(()=>null) as any;
 if(!b?.booking_id||!VISA.includes(b.visa_status)||!INSURANCE.includes(b.insurance_status))return NextResponse.json({error:'Invalid travel status.'},{status:400});
 const notes=String(b.internal_notes||'').trim();
 if(notes.length>2000)return NextResponse.json({error:'Notes exceed the allowed length.'},{status:400});
 const s=getSupabaseAdmin();
 const {data:booking,error:bookingError}=await s.from('bookings').select('id').eq('id',b.booking_id).is('archived_at',null).maybeSingle();
 if(bookingError||!booking)return NextResponse.json({error:'Booking not found.'},{status:404});
 const {data:before}=await s.from('booking_travel_admin').select('*').eq('booking_id',booking.id).maybeSingle();
 const values={booking_id:booking.id,visa_status:b.visa_status,insurance_status:b.insurance_status,internal_notes:notes||null,updated_by:staff!.profile.id,updated_at:new Date().toISOString()};
 const {data,error}=await s.from('booking_travel_admin').upsert(values,{onConflict:'booking_id'}).select('*').single();
 if(error)return NextResponse.json({error:'Unable to save travel status.'},{status:500});
 await s.from('audit_logs').insert({actor_id:staff!.profile.id,action:'BOOKING_TRAVEL_STATUS_UPDATED',entity_type:'booking_travel_admin',entity_id:data.id,before_data:before||null,after_data:data});
 revalidatePath('/admin/visa-insurance');return NextResponse.json({travel:data});
}