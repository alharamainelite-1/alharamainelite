import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ROLES = ['SUPER_ADMIN', 'OPERATIONS_MANAGER'];

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!ROLES.includes(staff.profile.role)) {
    return NextResponse.json({ error: 'Operations manager access required.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { group_id?: string; booking_id?: string } | null;
  if (!body?.group_id || !body.booking_id) {
    return NextResponse.json({ error: 'Group and booking are required.' }, { status: 400 });
  }

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(body.group_id) || !uuid.test(body.booking_id)) {
    return NextResponse.json({ error: 'A valid group and booking are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('assign_booking_to_group_atomic', {
    p_group_id: body.group_id,
    p_booking_id: body.booking_id,
    p_staff_id: staff.profile.id,
  });

  if (error) {
    const message = error.message || '';
    const status =
      error.code === 'P0002' ? 404 :
      error.code === '23505' ? 409 :
      error.code === '23514' ? 409 :
      error.code === '42501' ? 403 : 500;
    const safeMessage = [
      'Group not found',
      'Booking not found',
      'Group is not open for assignments',
      'Only confirmed bookings can be assigned to a group',
      'Booking payment must be fully received before group assignment',
      'Booking and group packages do not match',
      'Booking and group departure dates do not match',
      'Booking expected date does not match group departure',
      'Booking needs a travel date before group assignment',
      'Booking needs a travel period before group assignment',
      'Booking travel period does not match group',
      'Booking is already assigned to a group',
      'Group capacity exceeded',
      'Group assignment access required',
    ].find((candidate) => message.includes(candidate)) || 'Could not assign booking to group. Please try again.';
    return NextResponse.json({ error: safeMessage }, { status });
  }

  revalidatePath('/admin/groups');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/journeys');
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!ROLES.includes(staff.profile.role)) {
    return NextResponse.json({ error: 'Operations manager access required.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: 'Membership id is required.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: before, error: readError } = await supabase
    .from('group_members')
    .select('*')
    .eq('id', body.id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: 'Unable to load group assignment.' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Membership not found.' }, { status: 404 });

  const { error } = await supabase.from('group_members').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not remove booking from group.' }, { status: 500 });

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: staff.profile.id,
    action: 'BOOKING_REMOVED_FROM_GROUP',
    entity_type: 'group_member',
    entity_id: body.id,
    before_data: before,
  });
  if (auditError) {
    console.error('group_member_removal_audit_failed', { membershipId: body.id, code: auditError.code });
  }

  revalidatePath('/admin/groups');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/journeys');
  return NextResponse.json({ ok: true, auditRecorded: !auditError });
}
