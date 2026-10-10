import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ROLES = ['SUPER_ADMIN', 'SALES'];
const SALES_STATUSES = ['CONTACTED', 'DETAILS_PENDING', 'PAYMENT_PENDING', 'CANCELLED'];

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !ROLES.includes(staff.profile.role)) {
    return NextResponse.json({ error: 'Sales access required.' }, { status: staff ? 403 : 401 });
  }

  const body = await req.json().catch(() => null) as { id?: string; status?: string } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!body?.id || !uuid.test(body.id) || typeof body.status !== 'string') {
    return NextResponse.json({ error: 'Request and valid status are required.' }, { status: 400 });
  }

  // Payment receipt and operational stages must never be changed from the
  // request screen. They have dedicated, guarded workflows.
  if (!SALES_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Use the dedicated payment or booking workflow for this status.' }, { status: 409 });
  }

  const supabase = getSupabaseAdmin();
  const { data: before, error: requestReadError } = await supabase
    .from('journey_requests')
    .select('*')
    .eq('id', body.id)
    .maybeSingle();

  if (requestReadError) return NextResponse.json({ error: 'Unable to load request.' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  const { data: booking, error: bookingReadError } = await supabase
    .from('bookings')
    .select('id,status,payment_status')
    .eq('request_id', body.id)
    .is('archived_at', null)
    .maybeSingle();

  if (bookingReadError) return NextResponse.json({ error: 'Unable to verify linked booking.' }, { status: 500 });

  if (booking) {
    const { data, error } = await supabase.rpc('update_booking_status_atomic', {
      p_booking_id: booking.id,
      p_staff_id: staff.profile.id,
      p_status: body.status,
      p_notes: null,
    });

    if (error) {
      const code = error.code || '';
      const message = error.message || '';
      const status =
        code === 'P0002' ? 404 :
        code === '42501' ? 403 :
        code === '23514' ? 409 :
        code === '22023' ? 400 : 500;
      const safeMessage = [
        'You do not have permission for this status',
        'Only the Super Admin may cancel an active journey',
        'Completed or cancelled bookings are terminal',
        'Invalid booking status transition',
        'Payment must be fully received before this status',
        'Booking must belong to exactly one approved group before preparation',
        'Assign the host and Makkah and Madinah hotels before starting the journey',
        'All operations and host tasks must be completed or cancelled before closing the journey',
        'Booking not found',
        'Staff profile not found',
        'Invalid booking status',
      ].find((candidate) => message.includes(candidate)) || 'Could not update request through the booking workflow.';
      return NextResponse.json({ error: safeMessage }, { status });
    }

    revalidatePath('/admin/requests');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/groups');
    revalidatePath('/admin/journeys');
    revalidatePath('/admin');
    return NextResponse.json({ booking: data && (data as { booking?: unknown }).booking });
  }

  // Requests without a booking can only move through sales intake stages.
  if (!SALES_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'A booking must exist before confirmation.' }, { status: 409 });
  }

  const transitions: Record<string, string[]> = {
    NEW_REQUEST: ['CONTACTED', 'DETAILS_PENDING', 'PAYMENT_PENDING', 'CANCELLED'],
    CONTACTED: ['DETAILS_PENDING', 'PAYMENT_PENDING', 'CANCELLED'],
    DETAILS_PENDING: ['CONTACTED', 'PAYMENT_PENDING', 'CANCELLED'],
    PAYMENT_PENDING: ['CANCELLED'],
  };
  if (!(transitions[String(before.status)] || []).includes(body.status)) {
    return NextResponse.json({ error: 'Invalid request status transition.' }, { status: 409 });
  }

  const { data: after, error: updateError } = await supabase
    .from('journey_requests')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('*')
    .single();

  if (updateError || !after) return NextResponse.json({ error: 'Could not update request.' }, { status: 500 });

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: staff.profile.id,
    action: 'JOURNEY_REQUEST_STATUS_UPDATED',
    entity_type: 'journey_request',
    entity_id: body.id,
    before_data: before,
    after_data: after,
  });

  if (auditError) {
    console.error('journey_request_audit_failed', { requestId: body.id, code: auditError.code });
    return NextResponse.json({ error: 'Request updated, but audit logging failed. Contact the Super Admin.' }, { status: 500 });
  }

  revalidatePath('/admin/requests');
  revalidatePath('/admin');
  return NextResponse.json({ request: after, booking: null });
}
