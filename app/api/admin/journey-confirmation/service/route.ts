import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'OPERATIONS', 'OPERATIONS_MANAGER'] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!ALLOWED_ROLES.includes(staff.profile.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: 'Operations access required.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as {
    serviceType?: string; serviceId?: string; status?: string; reference?: string;
  } | null;
  if (!body || !['hotel', 'activity', 'train'].includes(body.serviceType || '') || !UUID.test(body.serviceId || '') ||
      !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(body.status || '')) {
    return NextResponse.json({ error: 'Valid service details are required.' }, { status: 400 });
  }
  const reference = typeof body.reference === 'string' ? body.reference.trim().slice(0, 160) : '';
  if (body.status === 'CONFIRMED' && !reference) {
    return NextResponse.json({ error: 'A supplier confirmation or ticket reference is required.' }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  const table = body.serviceType === 'hotel' ? 'hotel_assignments' : body.serviceType === 'activity' ? 'booking_activities' : 'train_bookings';
  const patch = body.serviceType === 'train'
    ? { status: body.status, reference: reference || null }
    : { confirmation_status: body.status, confirmation_reference: reference || null, confirmed_at: body.status === 'CONFIRMED' ? new Date().toISOString() : null };
  const { data, error } = await db.from(table).update(patch).eq('id', body.serviceId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update service confirmation.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Service record not found.' }, { status: 404 });
  await db.from('audit_logs').insert({
    actor_id: staff.profile.id,
    action: 'JOURNEY_SERVICE_CONFIRMATION_UPDATED',
    entity_type: table,
    entity_id: body.serviceId,
    after_data: { status: body.status, reference: reference || null },
  });
  revalidatePath('/admin/bookings');
  return NextResponse.json({ ok: true });
}
