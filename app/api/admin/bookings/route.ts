import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff, hasStaffPermission } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const STATUS = ['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED','CANCELLED'] as const;

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  if (!hasStaffPermission(staff, 'bookings', 'edit')) return NextResponse.json({ error: 'You do not have permission to update bookings.' }, { status: 403 });
  // Booking staff may manage booking details, but payment receipt is Finance-only.
  const requestBody = await req.clone().json().catch(() => null) as { status?: string } | null;
  if (requestBody?.status === 'PAYMENT_RECEIVED' && !['SUPER_ADMIN','FINANCE'].includes(staff.profile.role)) return NextResponse.json({ error: 'Payment receipt must be confirmed through Finance.' }, { status: 403 });

  const body = await req.json().catch(() => null) as {
    bookingId?: string;
    status?: string;
    notes?: string;
  } | null;

  if (
    !body?.bookingId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.bookingId) ||
    !body.status ||
    !STATUS.includes(body.status as typeof STATUS[number])
  ) {
    return NextResponse.json({ error: 'Invalid booking update.' }, { status: 400 });
  }

  if (body.notes !== undefined && typeof body.notes !== 'string') {
    return NextResponse.json({ error: 'Notes must be text.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('update_booking_status_atomic', {
    p_booking_id: body.bookingId,
    p_staff_id: staff.profile.id,
    p_status: body.status,
    p_notes: typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null,
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
    ].find((candidate) => message.includes(candidate)) || 'Could not update booking status. Please check the workflow requirements.';
    return NextResponse.json({ error: safeMessage }, { status });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/requests');
  revalidatePath('/admin/groups');
  revalidatePath('/admin/journeys');
  return NextResponse.json(data);
}
