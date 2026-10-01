import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ALLOWED_ROLES=['SUPER_ADMIN','FINANCE'];
const COMMISSION_RATE=0.05;

export async function POST(req:Request){
 const staff=await getCurrentStaff();
 if(!staff) return NextResponse.json({error:'Unauthorized.'},{status:401});
 if(!ALLOWED_ROLES.includes(staff.profile.role)) return NextResponse.json({error:'Payment verification access required.'},{status:403});

 const body=await req.json().catch(()=>null) as {bookingId?:string;notes?:string;reference?:string}|null;
 if(!body?.bookingId||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.bookingId))
   return NextResponse.json({error:'A valid booking is required.'},{status:400});

 const s=getSupabaseAdmin();
 const {data,error}=await s.rpc('verify_booking_payment_atomic',{
   p_booking_id:body.bookingId,
   p_staff_id:staff.profile.id,
   p_notes:typeof body.notes==='string'?body.notes.slice(0,2000):null,
   p_reference:typeof body.reference==='string'?body.reference.slice(0,160):null
 });
 if(error){
   const status=error.code==='P0002'?404:error.code==='23505'?409:error.code==='42501'?403:500;
   const known=['Booking not found','Payment is already marked as received','Booking is already fully paid in payment records','Payment verification access required'];
   const message=known.find(x=>error.message?.includes(x))||'Could not verify payment. Please try again.';
   console.error('atomic_payment_verification_failed',{code:error.code,message:error.message});
   return NextResponse.json({error:message},{status});
 }
 const result=data as {payment?:unknown;booking?:{id?:string;influencer_partner_id?:string|null;total_amount?:number|string};commission?:unknown}|null;
 if(!result?.payment||!result.booking?.id)
   return NextResponse.json({error:'Payment verification returned an incomplete result.'},{status:500});

 revalidatePath('/admin');
 revalidatePath('/admin/bookings');
 revalidatePath('/admin/payments');
 revalidatePath('/admin/finance');
 revalidatePath('/partner/dashboard');
 return NextResponse.json({
   payment:result.payment,
   booking:result.booking,
   commission:result.commission||null,
   commissionExpected:result.booking.influencer_partner_id?Number(result.booking.total_amount||0)*COMMISSION_RATE:0
 });
}
