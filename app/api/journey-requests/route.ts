import { NextResponse } from 'next/server';
import { journeyRequestSchema } from '@/lib/validation/journey';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    if (JSON.stringify(raw).length > 15000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    const parsed = journeyRequestSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: 'Please check the highlighted details.', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    const v = parsed.data;
    const partnerSlug = req.headers.get('cookie')?.match(/(?:^|; )he_partner_ref=([^;]+)/)?.[1] || null;
    const partnerSlug = req.headers.get('cookie')?.match(/(?:^|; )he_partner_ref=([^;]+)/)?.[1] || null;
    if (v.website) return NextResponse.json({ error: 'Please check the highlighted details.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('create_journey_request', {
      p_full_name: v.fullName, p_whatsapp: v.whatsapp, p_email: v.email || null, p_country: v.country, p_city: v.city || null,
      p_preferred_language: v.preferredLanguage, p_package_slug: v.packageSlug, p_guest_count: v.guestCount,
      p_expected_travel_date: v.expectedTravelDate || null, p_expected_period_start: v.expectedPeriodStart || null,
      p_expected_period_end: v.expectedPeriodEnd || null, p_expected_period_label: v.expectedPeriodLabel || null,
      p_additional_notes: v.additionalNotes || null, p_lead_source: v.leadSource, p_partner_slug: partnerSlug, p_partner_slug: partnerSlug,
    });
    if (error || !data) { console.error('journey_request_rpc_error', error); return NextResponse.json({ error: 'We could not receive your request right now. Please try again.' }, { status: 500 }); }
    return NextResponse.json({ reference: data.reference, bookingId: data.booking_id, total: Number(data.estimated_total), currency: data.currency }, { status: 201 });
  } catch (error) {
    console.error('journey_request_error', error);
    return NextResponse.json({ error: 'We could not receive your request right now. Please try again.' }, { status: 500 });
  }
}
