import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function riyadhToday() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const RESERVED_BOOKING_STATUSES = ['CONFIRMED', 'PAYMENT_RECEIVED', 'PREPARING', 'ACTIVE'] as const;

export async function GET() {
  try {
    // Read only explicitly public departure fields with the server-side client.
    // The service key never leaves this route; private booking data is not returned.
    const adminSupabase = getSupabaseAdmin();
    const today = riyadhToday();
    const { data: departures, error } = await adminSupabase
      .from('departures')
      .select('id,departure_date,duration_nights,group_size,max_groups,status,public_label')
      .eq('status', 'OPEN')
      .gte('departure_date', today)
      .order('departure_date', { ascending: true });

    if (error) {
      console.error('public_departures_query_failed', error);
      return NextResponse.json({ error: 'Unable to load departure dates.' }, {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    if (!departures?.length) {
      return NextResponse.json({ departures: [] }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const cappedIds = departures.filter((d) => d.max_groups != null).map((d) => d.id);
    let bookings: { departure_id: string; guest_count: number | null }[] = [];

    if (cappedIds.length > 0) {
      const { data, error: bookingError } = await adminSupabase
        .from('bookings')
        .select('departure_id,guest_count')
        .in('departure_id', cappedIds)
        .in('status', [...RESERVED_BOOKING_STATUSES]);

      if (bookingError) {
        console.error('public_departure_bookings_query_failed', bookingError);
        return NextResponse.json({ error: 'Unable to load departure availability.' }, {
          status: 500,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
      }
      bookings = data ?? [];
    }

    const reserved = new Map<string, number>();
    for (const booking of bookings) {
      reserved.set(
        booking.departure_id,
        (reserved.get(booking.departure_id) ?? 0) + Number(booking.guest_count ?? 0),
      );
    }

    const enriched = departures.map((departure) => {
      const capacityPerGroup = Number(departure.group_size || 8);
      const reservedGuests = reserved.get(departure.id) ?? 0;
      const groupsFilled = Math.floor(reservedGuests / capacityPerGroup);
      const seatsInCurrentGroup = reservedGuests % capacityPerGroup;
      const hasOpenCapacity =
        departure.max_groups == null || groupsFilled < Number(departure.max_groups);
      const totalCapacity =
        departure.max_groups == null
          ? null
          : capacityPerGroup * Number(departure.max_groups);
      const remainingTotal =
        totalCapacity == null ? null : Math.max(0, totalCapacity - reservedGuests);

      return {
        ...departure,
        reserved_guests: reservedGuests,
        groups_filled: groupsFilled,
        available_seats: hasOpenCapacity ? capacityPerGroup - seatsInCurrentGroup : 0,
        remaining_total_seats: remainingTotal,
        capacity_per_group: capacityPerGroup,
        availability_label: !hasOpenCapacity
          ? 'Fully booked'
          : seatsInCurrentGroup === 0 && reservedGuests > 0
            ? 'New group opening'
            : 'Limited availability',
      };
    }).filter((departure) => departure.available_seats > 0);

    return NextResponse.json({ departures: enriched }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('public_departures_unexpected_error', error);
    return NextResponse.json({ error: 'Unable to load departure dates.' }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}
