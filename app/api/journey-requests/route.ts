import { NextResponse } from 'next/server';
import { journeyRequestSchema } from '@/lib/validation/journey';
import { getSupabaseAdmin } from '@/lib/supabase/server';

function makeRef(prefix:string) {
  const year = new Date().getUTCFullYear();
  const token = Math.random().toString(36).slice(2,8).toUpperCase();
  return `${prefix}-${year}-${token}`;
}

export async function POST(req: Request) {
  try {
    const parsed = journeyRequestSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({error:'Please check the highlighted details.',issues:parsed.error.flatten().fieldErrors},{status:400});
    const v = parsed.data;
    const supabase = getSupabaseAdmin();
    const { data: pkg, error: pkgError } = await supabase.from('packages').select('id,slug,price,currency').eq('slug',v.packageSlug).eq('active',true).single();
    if (pkgError || !pkg) return NextResponse.json({error:'The selected package is unavailable.'},{status:409});
    const total = Number(pkg.price) * v.guestCount;
    const { data: customer, error: customerError } = await supabase.from('customers').insert({full_name:v.fullName,whatsapp:v.whatsapp,email:v.email || null,country:v.country,city:v.city || null,preferred_language:v.preferredLanguage}).select('id').single();
    if (customerError || !customer) throw customerError ?? new Error('Customer could not be created.');
    const reference = makeRef('HE');
    const { data: request, error: requestError } = await supabase.from('journey_requests').insert({reference,customer_id:customer.id,package_id:pkg.id,guest_count:v.guestCount,expected_travel_date:v.expectedTravelDate || null,expected_period_start:v.expectedPeriodStart || null,expected_period_end:v.expectedPeriodEnd || null,expected_period_label:v.expectedPeriodLabel || null,estimated_total:total,currency:pkg.currency,additional_notes:v.additionalNotes || null}).select('id,reference,estimated_total,currency').single();
    if (requestError || !request) throw requestError ?? new Error('Journey request could not be created.');
    const bookingId = makeRef('HE');
    const { error: bookingError } = await supabase.from('bookings').insert({booking_id:bookingId,request_id:request.id,customer_id:customer.id,package_id:pkg.id,guest_count:v.guestCount,total_amount:total,currency:pkg.currency,status:'NEW_REQUEST',payment_status:'NOT_REQUESTED',expected_travel_date:v.expectedTravelDate || null,expected_period_start:v.expectedPeriodStart || null,expected_period_end:v.expectedPeriodEnd || null,notes:v.additionalNotes || null});
    if (bookingError) throw bookingError;
    return NextResponse.json({reference:request.reference,bookingId,total,currency:pkg.currency},{status:201});
  } catch (error) {
    console.error('journey_request_error', error);
    return NextResponse.json({error:'We could not receive your request right now. Please try again.'},{status:500});
  }
}
