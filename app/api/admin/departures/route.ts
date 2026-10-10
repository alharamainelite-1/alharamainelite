import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ROLES = ['SUPER_ADMIN', 'OPERATIONS_MANAGER'];
const STATUS = ['OPEN', 'CLOSED', 'COMPLETED'];

async function auth() {
  const staff = await getCurrentStaff();
  if (!staff) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) };
  if (!ROLES.includes(staff.profile.role)) {
    return { error: NextResponse.json({ error: 'Departure management access required.' }, { status: 403 }) };
  }
  return { staff };
}

function validDate(value: unknown) {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value &&
    value >= new Date().toISOString().slice(0, 10);
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

export async function POST(req: Request) {
  const authResult = await auth();
  if (authResult.error) return authResult.error;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!validDate(body?.departure_date)) {
    return NextResponse.json({ error: 'Choose a valid future departure date.' }, { status: 400 });
  }

  const duration = boundedInteger(body?.duration_nights, 9, 1, 30);
  const groupSize = boundedInteger(body?.group_size, 8, 1, 8);
  let maxGroups: number | null = null;
  if (body?.max_groups !== '' && body?.max_groups != null) {
    const parsed = Number(body.max_groups);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      return NextResponse.json({ error: 'Maximum groups must be an integer between 1 and 100.' }, { status: 400 });
    }
    maxGroups = parsed;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('departures').insert({
    departure_date: body.departure_date,
    duration_nights: duration,
    group_size: groupSize,
    max_groups: maxGroups,
    status: 'OPEN',
    public_label: typeof body.public_label === 'string' ? body.public_label.slice(0, 160) || null : null,
    notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) || null : null,
  }).select('*').single();

  if (error) {
    return NextResponse.json(
      { error: error.code === '23505' ? 'A departure already exists for this date.' : 'Could not create departure.' },
      { status: error.code === '23505' ? 409 : 500 },
    );
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: authResult.staff.profile.id,
    action: 'DEPARTURE_CREATED',
    entity_type: 'departure',
    entity_id: data.id,
    after_data: data,
  });
  if (auditError) console.error('departure_audit_failed', { departureId: data.id, code: auditError.code });

  revalidatePath('/admin/departures');
  revalidatePath('/request-journey');
  return NextResponse.json({ departure: data, auditRecorded: !auditError }, { status: 201 });
}

export async function PATCH(req: Request) {
  const authResult = await auth();
  if (authResult.error) return authResult.error;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) {
    return NextResponse.json({ error: 'A valid departure id is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: before, error: loadError } = await supabase.from('departures').select('*').eq('id', body.id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'Unable to load departure.' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Departure not found.' }, { status: 404 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid departure status.' }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.departure_date !== undefined) {
    if (!validDate(body.departure_date)) {
      return NextResponse.json({ error: 'Choose a valid future departure date.' }, { status: 400 });
    }
    if (body.departure_date !== before.departure_date) {
      const { data: linked, error } = await supabase.from('bookings').select('id').eq('departure_id', body.id).limit(1);
      if (error) return NextResponse.json({ error: 'Unable to verify linked bookings.' }, { status: 500 });
      if (linked?.length) return NextResponse.json({ error: 'This date has linked bookings. Close it and add a new date instead.' }, { status: 409 });
      update.departure_date = body.departure_date;
      update.public_label = null;
    }
  }

  if (body.duration_nights !== undefined) update.duration_nights = boundedInteger(body.duration_nights, 9, 1, 30);
  if (body.group_size !== undefined) update.group_size = boundedInteger(body.group_size, 8, 1, 8);
  if (body.max_groups !== undefined) {
    if (body.max_groups === '' || body.max_groups == null) update.max_groups = null;
    else {
      const parsed = Number(body.max_groups);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        return NextResponse.json({ error: 'Maximum groups must be an integer between 1 and 100.' }, { status: 400 });
      }
      update.max_groups = parsed;
    }
  }
  if (body.public_label !== undefined) update.public_label = typeof body.public_label === 'string' ? body.public_label.slice(0, 160) || null : null;
  if (body.notes !== undefined) update.notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) || null : null;

  const { data, error } = await supabase.from('departures').update(update).eq('id', body.id).select('*').single();
  if (error) {
    return NextResponse.json(
      { error: error.code === '23505' ? 'A departure already exists for this date.' : 'Could not update departure.' },
      { status: error.code === '23505' ? 409 : 500 },
    );
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: authResult.staff.profile.id,
    action: 'DEPARTURE_UPDATED',
    entity_type: 'departure',
    entity_id: body.id,
    before_data: before,
    after_data: data,
  });
  if (auditError) console.error('departure_audit_failed', { departureId: body.id, code: auditError.code });

  revalidatePath('/admin/departures');
  revalidatePath('/request-journey');
  return NextResponse.json({ departure: data, auditRecorded: !auditError });
}

export async function DELETE(req: Request) {
  const authResult = await auth();
  if (authResult.error) return authResult.error;
  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (typeof body?.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) {
    return NextResponse.json({ error: 'A valid departure id is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: before, error: loadError } = await supabase.from('departures').select('*').eq('id', body.id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'Unable to load departure.' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Departure not found.' }, { status: 404 });

  const { data: linked, error: bookingError } = await supabase.from('bookings').select('id').eq('departure_id', body.id).limit(1);
  if (bookingError) return NextResponse.json({ error: 'Unable to verify linked bookings.' }, { status: 500 });
  if (linked?.length) return NextResponse.json({ error: 'This date has linked bookings and cannot be deleted. Close it instead.' }, { status: 409 });

  const { error } = await supabase.from('departures').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not delete departure.' }, { status: 500 });

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: authResult.staff.profile.id,
    action: 'DEPARTURE_DELETED',
    entity_type: 'departure',
    entity_id: body.id,
    before_data: before,
  });
  if (auditError) console.error('departure_audit_failed', { departureId: body.id, code: auditError.code });

  revalidatePath('/admin/departures');
  revalidatePath('/request-journey');
  return NextResponse.json({ success: true, auditRecorded: !auditError });
}
