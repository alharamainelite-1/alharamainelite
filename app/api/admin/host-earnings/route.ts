import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const FINANCE = ['SUPER_ADMIN','FINANCE'];

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!FINANCE.includes(staff.profile.role)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });
  const { data, error } = await getSupabaseAdmin().from('host_earnings')
    .select('id,host_task_id,host_id,amount,currency,status,approved_by,approved_at,paid_by,paid_at,payment_reference,finance_notes,created_at,updated_at,hosts(name),host_tasks(task_id,task_type,date,start_time,end_time)')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Unable to load host earnings.' }, { status: 500 });
  return NextResponse.json({ earnings: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!FINANCE.includes(staff.profile.role)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });
  const b = await req.json().catch(() => null) as any;
  if (!b?.id || !['APPROVED','REJECTED','PAID'].includes(String(b.status)))
    return NextResponse.json({ error: 'Provide an earning id and valid finance status.' }, { status: 400 });
  if (b.status === 'PAID' && !String(b.payment_reference || '').trim())
    return NextResponse.json({ error: 'A payment reference is required to record payment.' }, { status: 400 });
  const s = getSupabaseAdmin();
  const { data: before, error: readError } = await s.from('host_earnings').select('*').eq('id', b.id).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Unable to read earning record.' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Earning record not found.' }, { status: 404 });
  const now = new Date().toISOString();
  const update: any = { status: b.status, updated_at: now };
  if (b.status === 'APPROVED' || b.status === 'REJECTED') {
    if (before.status !== 'PENDING_REVIEW') return NextResponse.json({ error: 'Only pending earnings can be reviewed.' }, { status: 409 });
    update.approved_by = staff.profile.id;
    update.approved_at = now;
    if (b.finance_notes !== undefined) update.finance_notes = String(b.finance_notes).slice(0,2000);
  } else {
    if (before.status !== 'APPROVED') return NextResponse.json({ error: 'Only approved earnings can be paid.' }, { status: 409 });
    update.paid_by = staff.profile.id;
    update.paid_at = now;
    update.payment_reference = String(b.payment_reference).trim().slice(0,200);
    if (b.finance_notes !== undefined) update.finance_notes = String(b.finance_notes).slice(0,2000);
  }
  const { data, error } = await s.from('host_earnings').update(update).eq('id', b.id).eq('status', before.status)
    .select('id,host_task_id,host_id,amount,currency,status,approved_by,approved_at,paid_by,paid_at,payment_reference,finance_notes,created_at,updated_at').maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to update earning status.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Earning was changed by another user. Refresh and retry.' }, { status: 409 });
  const { error: auditError } = await s.from('audit_logs').insert({
    actor_id: staff.profile.id, action: 'HOST_EARNING_' + b.status, entity_type: 'host_earning',
    entity_id: data.id, before_data: before, after_data: data
  });
  if (auditError) return NextResponse.json({ error: 'Status saved, but audit logging failed. Contact an administrator.' }, { status: 500 });
  revalidatePath('/admin/finance'); revalidatePath('/admin/host-tasks');
  return NextResponse.json({ earning: data }, { headers: { 'Cache-Control': 'no-store' } });
}
