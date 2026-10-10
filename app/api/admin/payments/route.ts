import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff, hasStaffPermission } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const PAYMENT_STATUS = ['NOT_REQUESTED','PAYMENT_INSTRUCTIONS_SENT','PENDING_VERIFICATION','RECEIVED','PARTIALLY_RECEIVED','REFUNDED','FAILED'] as const;
const FINANCE_ROLES=['SUPER_ADMIN','FINANCE'];


export async function POST(req: Request) {
  const staff=await getCurrentStaff();
  if(!staff||!FINANCE_ROLES.includes(staff.profile.role))return NextResponse.json({error:'Finance access required.'},{status:403});
  if(!hasStaffPermission(staff,'payments','create'))return NextResponse.json({error:'You do not have permission to record payments.'},{status:403});
  const body=await req.json().catch(()=>null) as any;
  const amount=Number(body?.amount);
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(typeof body?.booking_id!=='string'||!uuid.test(body.booking_id)||!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:'Booking and a valid amount are required.'},{status:400});
  const paymentDate=body.date===undefined||body.date===null||body.date===''?new Date().toISOString().slice(0,10):String(body.date);
  const parsedDate=new Date(paymentDate+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)||Number.isNaN(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==paymentDate){
    return NextResponse.json({error:'A valid payment date is required.'},{status:400});
  }
  const {data,error}=await getSupabaseAdmin().rpc('record_booking_payment_atomic',{
    p_booking_id:body.booking_id,
    p_staff_id:staff.profile.id,
    p_amount:amount,
    p_currency:typeof body.currency==='string'?body.currency:null,
    p_date:paymentDate,
    p_method:typeof body.method==='string'?body.method:'BANK_TRANSFER',
    p_reference:typeof body.reference==='string'?body.reference.slice(0,300):null,
    p_notes:typeof body.notes==='string'?body.notes.slice(0,4000):null
  });
  if(error){
    const code=error.code||'';
    const message=error.message||'';
    const status=code==='P0002'?404:code==='42501'?403:code==='22023'?400:500;
    const safeMessage=[
      'Booking not found',
      'Payment recording access required',
      'Invalid payment amount',
      'Payment currency must match the booking currency',
      'Payment exceeds remaining booking balance',
      'Only bank transfer is enabled',
      'Payment notes are too long',
      'Payment reference is too long'
    ].find(candidate=>message.includes(candidate))||'Could not record payment. Please try again.';
    console.error('atomic_payment_record_failed',{code,message});
    return NextResponse.json({error:safeMessage},{status});
  }
  revalidatePath('/admin/payments');revalidatePath('/admin/bookings');revalidatePath('/admin/finance');
  return NextResponse.json(data,{status:201});
}

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!FINANCE_ROLES.includes(staff.profile.role)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });

  if(!hasStaffPermission(staff,'payments','approve'))return NextResponse.json({error:'You do not have permission to verify payments.'},{status:403});
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
