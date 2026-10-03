import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
const ROLES=['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES'];
const VISA=['NOT_STARTED','DOCUMENTS_PENDING','SUBMITTED','UNDER_REVIEW','ISSUED','REJECTED','NOT_REQUIRED'];
const INSURANCE=['NOT_STARTED','PENDING','ISSUED','NOT_REQUIRED'];
async function authorized(){const staff=await getCurrentStaff();if(!staff)return {staff:null,response:NextResponse.json({error:'Unauthorized.'},{status:401})};if(!ROLES.includes(staff.profile.role))return {staff,response:NextResponse.json({error:'Access denied.'},{status:403})};return {staff,response:null};}
export async function GET(){
 const {staff,response}=await authorized();if(response)return response;
 const s=getSupabaseAdmin();
 const {data:guests,error}=await s.from('booking_guests').select('id,booking_id,full_name,email,country').order('created_at',{ascending:false}).limit(500);
 if(error)return NextResponse.json({error:'Unable to load guest records.'},{status:500});
 const ids=(guests||[]).map(g=>g.booking_id);
 const [bookings,statuses]=await Promise.all([
  ids.length?s.from('bookings').select('id,booking_id,status,expected_travel_date,expected_period_start,expected_period_end').in('id',[...new Set(ids)]):Promise.resolve({data:[],error:null} as any),
  guests?.length?s.from('booking_guest_travel_admin').select('booking_guest_id,visa_status,visa_reference,visa_expiry_date,insurance_status,insurance_reference,insurance_expiry_date,internal_notes,updated_at').in('booking_guest_id',guests.map(g=>g.id)):Promise.resolve({data:[],error:null} as any)
 ]);
 if(bookings.error||statuses.error)return NextResponse.json({error:'Unable to load travel administration records.'},{status:500});
 const bookingMap=new Map((bookings.data||[]).map((b:any)=>[b.id,b]));
 const statusMap=new Map((statuses.data||[]).map((x:any)=>[x.booking_guest_id,x]));
 return NextResponse.json({guests:(guests||[]).map(g=>({...g,booking:bookingMap.get(g.booking_id)||null,travel:statusMap.get(g.id)||null}))});
}
export async function PATCH(req:Request){
 const {staff,response}=await authorized();if(response)return response;
 const b=await req.json().catch(()=>null) as any;
 if(!b?.booking_guest_id||!VISA.includes(b.visa_status)||!INSURANCE.includes(b.insurance_status))return NextResponse.json({error:'Invalid guest travel status.'},{status:400});
 const visaRef=String(b.visa_reference||'').trim(),insuranceRef=String(b.insurance_reference||'').trim(),notes=String(b.internal_notes||'').trim();
 if(visaRef.length>160||insuranceRef.length>160||notes.length>3000)return NextResponse.json({error:'One or more fields exceed the allowed length.'},{status:400});
 const s=getSupabaseAdmin();
 const {data:guest,error:guestError}=await s.from('booking_guests').select('id,booking_id').eq('id',b.booking_guest_id).maybeSingle();
 if(guestError||!guest)return NextResponse.json({error:'Guest record not found.'},{status:404});
 const {data:before}=await s.from('booking_guest_travel_admin').select('*').eq('booking_guest_id',guest.id).maybeSingle();
 const values={booking_guest_id:guest.id,visa_status:b.visa_status,visa_reference:visaRef||null,visa_expiry_date:b.visa_expiry_date||null,insurance_status:b.insurance_status,insurance_reference:insuranceRef||null,insurance_expiry_date:b.insurance_expiry_date||null,internal_notes:notes||null,updated_by:staff!.profile.id,updated_at:new Date().toISOString()};
 const {data,error}=await s.from('booking_guest_travel_admin').upsert(values,{onConflict:'booking_guest_id'}).select('*').single();
 if(error)return NextResponse.json({error:'Unable to save travel administration status.'},{status:500});
 await s.from('audit_logs').insert({actor_id:staff!.profile.id,action:'GUEST_TRAVEL_STATUS_UPDATED',entity_type:'booking_guest_travel_admin',entity_id:data.id,before_data:before||null,after_data:data});
 revalidatePath('/admin/visa-insurance');return NextResponse.json({travel:data});
}
