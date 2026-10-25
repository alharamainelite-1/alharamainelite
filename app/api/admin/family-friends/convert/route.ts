import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff, hasStaffPermission } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasStaffPermission(staff, 'familyFriends', 'edit') || !hasStaffPermission(staff, 'bookings', 'create')) {
    return NextResponse.json({ error: 'You do not have permission to convert quote requests into bookings.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as { request_id?: unknown } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!body || typeof body.request_id !== 'string' || !uuid.test(body.request_id)) {
    return NextResponse.json({ error: 'Choose a valid request.' }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc('convert_family_friends_quote_to_booking', {
    p_request_id: body.request_id,
    p_actor_id: staff.profile.id,
  });
  if (error) {
    console.error('family_friends_conversion_failed', { code: error.code, message: error.message });
    const message = error.message.includes('must be CONFIRMED') ? 'يجب أن تكون حالة الطلب «مؤكد» قبل تحويله.' :
      error.message.includes('positive approved quote') ? 'أدخل سعرًا معتمدًا موجبًا قبل التحويل.' :
      error.message.includes('not found') ? 'الطلب غير موجود.' : 'تعذر إنشاء الحجز. لم يتم تأكيد نجاح العملية؛ راجع الطلب قبل إعادة المحاولة.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.booking_uuid || !result?.booking_code) {
    return NextResponse.json({ error: 'The database did not return a confirmed booking result.' }, { status: 500 });
  }
  revalidatePath('/admin/family-friends');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/operations-booking-requests');
  return NextResponse.json({ booking_id: result.booking_uuid, booking_code: result.booking_code, already_converted: !!result.already_converted });
}
