import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ALLOWED_ROLES=['SUPER_ADMIN','ADMIN','FINANCE'];
const COMMISSION_RATE=0.05;

export async function POST(req:Request){
 const staff=await getCurrentStaff();
 if(!staff) return NextResponse.json({error:'Unauthorized.'},{status:401});
 if(!ALLOWED_ROLES.includes(staff.profile.role)) return NextResponse.json({error:'Payment verification access required.'},{status:403});

 const body=await req.json().catch(()=>null) as {bookingId?:string;notes?:string;reference?:string}|null;
 if(!body?.bookingId) return NextResponse.json({error:'Booking is required.'},{status:400});

 const s=getSupabaseAdmin();
 const {data:booking,error:bookingError}=await s.from('bookings')
   .select('id,booking_id,total_amount,currency,payment_status,status')
   .eq('id',body.bookingId).single();
 if(bookingError||!booking) return NextResponse.json({error:'Booking not found.'},{status:404});
 if(booking.payment_status==='RECEIVED') return NextResponse.json({error:'Payment is already marked as received.'},{status:409});

 const {data:receivedRows,error:paymentsError}=await s.from('payments')
   .select('amount')
   .eq('booking_id',booking.id)
   .eq('status','RECEIVED');
 if(paymentsError) return NextResponse.json({error:paymentsError.message},{status:500});

 const receivedTotal=(receivedRows||[]).reduce((n:number,p:any)=>n+Number(p.amount||0),0);
 const remaining=Math.max(0,Number(booking.total_amount||0)-receivedTotal);
 if(remaining<=0) return NextResponse.json({error:'The booking is already fully paid in the payment records.'},{status:409});

 const now=new Date().toISOString();
 const {data:payment,error:paymentError}=await s.from('payments').insert({
   payment_id:'PAY-'+Date.now().toString(36).toUpperCase(),
   booking_id:booking.id,
   amount:remaining,
   currency:booking.currency||'USD',
   date:now.slice(0,10),
   method:'BANK_TRANSFER',
   reference:body.reference||null,
   status:'RECEIVED',
   notes:body.notes||'Payment verified and marked received by administration.',
   verified_by:staff.profile.id,
   verified_at:now
 }).select('*').single();
 if(paymentError) return NextResponse.json({error:paymentError.message},{status:500});

 const {data:after,error:updateError}=await s.from('bookings')
   .update({payment_status:'RECEIVED',status:'PAYMENT_RECEIVED',updated_at:now})
   .eq('id',booking.id).select('*').single();
 if(updateError||!after) return NextResponse.json({error:updateError?.message||'Could not update booking payment status.'},{status:500});

 await s.from('audit_logs').insert([
   {actor_id:staff.profile.id,action:'PAYMENT_MARKED_RECEIVED',entity_type:'payment',entity_id:payment.id,before_data:null,after_data:payment},
   {actor_id:staff.profile.id,action:'BOOKING_PAYMENT_STATUS_SYNCED',entity_type:'booking',entity_id:booking.id,before_data:booking,after_data:after}
 ]);

 revalidatePath('/admin');
 revalidatePath('/admin/bookings');
 revalidatePath('/admin/payments');
 revalidatePath('/admin/finance');
 revalidatePath('/partner/dashboard');

 const {data:commission}=await s.from('influencer_commissions')
  .select('id,amount,status,available_at')
  .eq('booking_id',after.id)
  .eq('type','COMMISSION')
  .in('status',['PENDING','PAID'])
  .maybeSingle();

 return NextResponse.json({
   payment,
   booking:after,
   commission:commission||null,
   commissionExpected:after.influencer_partner_id?Number(after.total_amount||0)*COMMISSION_RATE:0
 });
}
