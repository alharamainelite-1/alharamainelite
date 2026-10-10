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
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!body?.paymentId || !uuid.test(body.paymentId) || !body.status || !PAYMENT_STATUS.includes(body.status as typeof PAYMENT_STATUS[number])) {
    return NextResponse.json({ error: 'Invalid payment update.' }, { status: 400 });
  }
  if (body.notes !== undefined && typeof body.notes !== 'string') {
    return NextResponse.json({ error: 'Payment notes must be text.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('update_payment_status_atomic', {
    p_payment_id: body.paymentId,
    p_staff_id: staff.profile.id,
    p_status: body.status,
    p_notes: typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null,
  });

  if (error) {
    const code = error.code || '';
    const message = error.message || '';
    const status = code === 'P0002' ? 404 : code === '42501' ? 403 : code === '22023' ? 400 : 500;
    const safeMessage = [
      'Payment verification access required',
      'Payment not found',
      'Booking not found',
      'Invalid payment status',
    ].find((candidate) => message.includes(candidate)) || 'Could not update payment. Please try again.';
    console.error('atomic_payment_status_update_failed', { code, message });
    return NextResponse.json({ error: safeMessage }, { status });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/finance');
  revalidatePath('/partner/dashboard');
  return NextResponse.json(data);
}
