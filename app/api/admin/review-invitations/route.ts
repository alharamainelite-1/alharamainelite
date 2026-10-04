import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS'].includes(staff.profile.role))
    return NextResponse.json({ error: 'You do not have permission.' }, { status: 403 });
  const body = await req.json().catch(() => null) as { bookingId?: string; language?: string } | null;
  if (!body?.bookingId || !/^[0-9a-f-]{36}$/i.test(body.bookingId))
    return NextResponse.json({ error: 'Invalid booking.' }, { status: 400 });
  const language = ['en','so','ar'].includes(body.language || '') ? body.language! : 'en';
  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase.from('bookings')
    .select('id,booking_id,status,customer_id,customers(full_name,whatsapp)')
    .eq('id', body.bookingId).single();
  if (error || !booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (booking.status !== 'COMPLETED') return NextResponse.json({ error: 'Reviews are available only for completed journeys.' }, { status: 409 });
  const { data: existing } = await supabase.from('review_invitations')
    .select('id,submitted_at,expires_at').eq('booking_id', booking.id).maybeSingle();
  if (existing?.submitted_at) return NextResponse.json({ error: 'A review was already submitted for this booking.' }, { status: 409 });
  const token = randomBytes(32).toString('base64url');
  const token_hash = createHash('sha256').update(token).digest('hex');
  const expires_at = new Date(Date.now() + 90*24*60*60*1000).toISOString();
  let write;
  if (existing) {
    write = await supabase.from('review_invitations').update({ token_hash,language,created_by:staff.profile.id,expires_at,sent_at:null }).eq('id',existing.id);
  } else {
    write = await supabase.from('review_invitations').insert({ booking_id:booking.id,token_hash,language,created_by:staff.profile.id,expires_at });
  }
  if (write.error) return NextResponse.json({ error: write.error.message }, { status: 500 });
  const origin = new URL(req.url).origin;
  const url = origin + '/review/' + token;
  const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
  const message = language==='so'
    ? 'Waad ku mahadsan tahay inaad ALHARAMAIN ELITE nagu aamintay. Fadlan nala wadaag qiimeynta safarkaaga: '+url
    : language==='ar'
      ? 'شكرًا لثقتكم بـ ALHARAMAIN ELITE. يسعدنا مشاركة تقييمكم لرحلتكم عبر الرابط: '+url
      : 'Thank you for choosing ALHARAMAIN ELITE. We would appreciate your feedback about your journey: '+url;
  await supabase.from('review_invitations').update({sent_at:new Date().toISOString()}).eq('booking_id',booking.id);
  await supabase.from('communication_logs').insert({booking_id:booking.id,customer_id:booking.customer_id,channel:'WHATSAPP',status:'LINK_GENERATED',sent_by:staff.profile.id});
  return NextResponse.json({ url, message, whatsapp: customer?.whatsapp || null, expiresAt:expires_at });
}
