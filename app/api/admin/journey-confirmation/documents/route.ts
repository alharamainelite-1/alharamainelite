import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (staff.profile.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { bookingId?: string; language?: string; checklist?: unknown } | null;
  if (!body || !UUID.test(body.bookingId || '') || !['ar','en'].includes(body.language || '')) {
    return NextResponse.json({ error: 'Valid booking and document language are required.' }, { status: 400 });
  }
  const checklist = body.checklist as Record<string, unknown> | undefined;
  if (!checklist || !['guest','dates','services','group'].every((key) => checklist[key] === true)) {
    return NextResponse.json({ error: 'Complete the review checklist first.' }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  const { data: booking, error: bookingError } = await db.from('bookings')
    .select('id,status,payment_status').eq('id', body.bookingId).is('archived_at', null).maybeSingle();
  if (bookingError || !booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (booking.status !== 'CONFIRMED' || booking.payment_status !== 'RECEIVED') {
    return NextResponse.json({ error: 'Booking must be confirmed and payment verified.' }, { status: 409 });
  }
  const { data: member } = await db.from('group_members').select('group_id').eq('booking_id', booking.id).maybeSingle();
  if (!member?.group_id) return NextResponse.json({ error: 'A confirmed operational group is required.' }, { status: 409 });
  const [hotels, activities, trains] = await Promise.all([
    db.from('hotel_assignments').select('id,confirmation_status,confirmation_reference').eq('group_id', member.group_id),
    db.from('booking_activities').select('id,confirmation_status,confirmation_reference').or('booking_id.eq.' + booking.id + ',group_id.eq.' + member.group_id),
    db.from('train_bookings').select('id,status,reference').eq('group_id', member.group_id),
  ]);
  if (hotels.error || activities.error || trains.error) return NextResponse.json({ error: 'Could not verify operational services.' }, { status: 500 });
  const hotelRows = hotels.data || [];
  const activityRows = activities.data || [];
  const trainRows = trains.data || [];
  if (!hotelRows.length || !activityRows.length) return NextResponse.json({ error: 'At least one hotel and one visit or tour must be recorded.' }, { status: 409 });
  const allConfirmed = hotelRows.every((x) => x.confirmation_status === 'CONFIRMED' && !!x.confirmation_reference?.trim()) &&
    activityRows.every((x) => x.confirmation_status === 'CONFIRMED' && !!x.confirmation_reference?.trim()) &&
    trainRows.every((x) => x.status === 'CONFIRMED' && !!x.reference?.trim());
  if (!allConfirmed) return NextResponse.json({ error: 'Every recorded hotel, visit, tour and train must be confirmed with a reference.' }, { status: 409 });
  const { data: previous, error: previousError } = await db.from('journey_confirmation_documents').select('version').eq('booking_id', booking.id).order('version', { ascending: false }).limit(1).maybeSingle();
  if (previousError) return NextResponse.json({ error: 'Could not load document history.' }, { status: 500 });
  const version = Number(previous?.version || 0) + 1;
  const { data, error } = await db.from('journey_confirmation_documents').insert({
    booking_id: booking.id, version, language: body.language, document_status: 'GENERATED',
    checklist, created_by: staff.profile.id,
  }).select('id,version,created_at').single();
  if (error) return NextResponse.json({ error: 'Could not record confirmation document.' }, { status: 500 });
  revalidatePath('/admin/bookings/' + booking.id + '/confirmation');
  return NextResponse.json({ document: data });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (staff.profile.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { documentId?: string } | null;
  if (!body || !UUID.test(body.documentId || '')) return NextResponse.json({ error: 'Valid document is required.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('journey_confirmation_documents').update({
    document_status: 'SENT', sent_at: new Date().toISOString(), sent_by: staff.profile.id,
  }).eq('id', body.documentId).eq('document_status', 'GENERATED').select('id,booking_id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update document delivery log.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Document not found or already marked sent.' }, { status: 404 });
  await db.from('communication_logs').insert({
    booking_id: data.booking_id, channel: 'WHATSAPP', status: 'MANUALLY_SENT_JOURNEY_CONFIRMATION', sent_by: staff.profile.id,
  });
  revalidatePath('/admin/bookings/' + data.booking_id + '/confirmation');
  return NextResponse.json({ ok: true });
}
