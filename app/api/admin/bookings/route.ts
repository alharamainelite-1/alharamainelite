import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const STATUS = ['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','HANDED_TO_OPERATIONS','OPERATIONS_IN_PROGRESS','PREPARING','JOURNEY_READY','ACTIVE','COMPLETED','CANCELLED'] as const;
const ALLOWED: Record<string,string[]> = {
  SALES: ['CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','HANDED_TO_OPERATIONS','CANCELLED'],
  FINANCE: ['PAYMENT_RECEIVED','PAYMENT_PENDING'],
  OPERATIONS_MANAGER: ['OPERATIONS_IN_PROGRESS','PREPARING','JOURNEY_READY','ACTIVE','COMPLETED','CANCELLED'],
  OPERATIONS: ['OPERATIONS_IN_PROGRESS','PREPARING','JOURNEY_READY','ACTIVE','COMPLETED'],
  ADMIN: [...STATUS],
  SUPER_ADMIN: [...STATUS],
};

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json().catch(() => null) as { bookingId?: string; status?: string; notes?: string } | null;
  if (!body?.bookingId || !body.status || !STATUS.includes(body.status as typeof STATUS[number])) return NextResponse.json({ error: 'Invalid booking update.' }, { status: 400 });
  const allowed = ALLOWED[staff.profile.role] || [];
  if (!allowed.includes(body.status)) return NextResponse.json({ error: 'You do not have permission for this status.' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  const { data: before, error: readError } = await supabase.from('bookings').select('*').eq('id', body.bookingId).single();
  if (readError || !before) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (body.status === 'CONFIRMED' && before.payment_status !== 'RECEIVED') return NextResponse.json({ error: 'A booking can only be confirmed after finance marks payment as received.' }, { status: 409 });
  if (body.status === 'HANDED_TO_OPERATIONS' && before.payment_status !== 'RECEIVED') return NextResponse.json({ error: 'Complete payment verification before handing a booking to operations.' }, { status: 409 });
  const update: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() };
  if (body.notes !== undefined) update.notes = String(body.notes).slice(0, 4000);
  const { data: after, error } = await supabase.from('bookings').update(update).eq('id', body.bookingId).select('*').single();
  if (error || !after) return NextResponse.json({ error: error?.message || 'Could not update booking.' }, { status: 500 });
  await supabase.from('journey_requests').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', before.request_id);
  await supabase.from('audit_logs').insert({ actor_id: staff.profile.id, action: 'BOOKING_STATUS_UPDATED', entity_type: 'booking', entity_id: before.id, before_data: before, after_data: after });
  revalidatePath('/admin'); revalidatePath('/admin/bookings'); revalidatePath('/admin/requests');
  return NextResponse.json({ booking: after });
}
