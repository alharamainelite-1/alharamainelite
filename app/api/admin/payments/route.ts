import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const PAYMENT_STATUS = ['NOT_REQUESTED','PAYMENT_INSTRUCTIONS_SENT','PENDING_VERIFICATION','RECEIVED','PARTIALLY_RECEIVED','REFUNDED','FAILED'] as const;
const FINANCE_ROLES=['SUPER_ADMIN','FINANCE'];


export async function POST(req: Request) {
  const staff=await getCurrentStaff();
  if(!staff||!FINANCE_ROLES.includes(staff.profile.role))return NextResponse.json({error:'Finance access required.'},{status:403});
  const body=await req.json().catch(()=>null) as any;
  const amount=Number(body?.amount);
  if(!body?.booking_id||!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:'Booking and a valid amount are required.'},{status:400});
  const s=getSupabaseAdmin();
  const {data:booking}=await s.from('bookings').select('id,booking_id,total_amount,currency').eq('id',body.booking_id).single();
  if(!booking)return NextResponse.json({error:'Booking not found.'},{status:404});
  const {data,error}=await s.from('payments').insert({payment_id:'PAY-'+Date.now().toString(36).toUpperCase(),booking_id:booking.id,amount,currency:body.currency||booking.currency||'USD',date:body.date||new Date().toISOString().slice(0,10),method:body.method||'BANK_TRANSFER',reference:body.reference||null,status:'PENDING_VERIFICATION',notes:body.notes||null}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await s.from('bookings').update({payment_status:'PENDING_VERIFICATION',updated_at:new Date().toISOString()}).eq('id',booking.id);
  await s.from('audit_logs').insert({actor_id:staff.profile.id,action:'PAYMENT_RECORDED',entity_type:'payment',entity_id:data.id,after_data:data});
  revalidatePath('/admin/payments');revalidatePath('/admin/bookings');revalidatePath('/admin/finance');
  return NextResponse.json({payment:data},{status:201});
}

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!FINANCE_ROLES.includes(staff.profile.role)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });

  const body = await req.json().catch(() => null) as { paymentId?: string; status?: string; notes?: string } | null;
  if (!body?.paymentId || !body.status || !PAYMENT_STATUS.includes(body.status as typeof PAYMENT_STATUS[number])) {
    return NextResponse.json({ error: 'Invalid payment update.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: before, error: readError } = await supabase.from('payments').select('*').eq('id', body.paymentId).single();
  if (readError || !before) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status: body.status };
  if (body.status === 'RECEIVED') { update.verified_by = staff.profile.id; update.verified_at = now; }
  if (body.status !== 'RECEIVED') { update.verified_by = null; update.verified_at = null; }
  if (body.notes !== undefined) update.notes = String(body.notes).slice(0, 4000);

  const { data: after, error } = await supabase.from('payments').update(update).eq('id', body.paymentId).select('*').single();
  if (error || !after) return NextResponse.json({ error: error?.message || 'Could not update payment.' }, { status: 500 });

  const { data: bookingBefore } = await supabase.from('bookings').select('id,total_amount').eq('id',before.booking_id).single();
  const { data: receivedRows } = await supabase.from('payments').select('amount,status').eq('booking_id',before.booking_id);
  const receivedTotal=(receivedRows||[]).filter((p:any)=>p.status==='RECEIVED').reduce((n:number,p:any)=>n+Number(p.amount||0),0);
  const fullyPaid=Boolean(bookingBefore && receivedTotal>=Number(bookingBefore.total_amount));
  const bookingStatus=fullyPaid?'PAYMENT_RECEIVED':undefined;
  const paymentState=fullyPaid?'RECEIVED':(receivedTotal>0?'PARTIALLY_RECEIVED':body.status);
  const bookingUpdate: Record<string, unknown> = { payment_status: paymentState, updated_at: now };
  if (bookingStatus) bookingUpdate.status = bookingStatus;
  const { data: booking } = await supabase.from('bookings').update(bookingUpdate).eq('id', before.booking_id).select('*').single();
  await supabase.from('audit_logs').insert({ actor_id: staff.profile.id, action: 'PAYMENT_STATUS_UPDATED', entity_type: 'payment', entity_id: before.id, before_data: before, after_data: after });
  if (booking) await supabase.from('audit_logs').insert({ actor_id: staff.profile.id, action: 'BOOKING_PAYMENT_STATUS_SYNCED', entity_type: 'booking', entity_id: booking.id, after_data: booking });

  revalidatePath('/admin');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/bookings');
  return NextResponse.json({ payment: after, booking });
}
