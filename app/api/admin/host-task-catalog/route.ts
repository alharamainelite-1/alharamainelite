import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const EDITORS = ['SUPER_ADMIN', 'FINANCE'];
const TASK_TYPES = ['AIRPORT_ASSISTANCE','TRAIN_ASSISTANCE','MAKKAH_ZIYARAT','MADINAH_ZIYARAT','JEDDAH_EXPERIENCE','SPECIAL_ASSISTANCE','OTHER'];

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!['SUPER_ADMIN','FINANCE','OPERATIONS_MANAGER','OPERATIONS'].includes(staff.profile.role))
    return NextResponse.json({ error: 'Operations or Finance access required.' }, { status: 403 });
  const { data, error } = await getSupabaseAdmin().from('host_task_catalog')
    .select('id,task_type,title,description,amount,currency,active,created_at,updated_at')
    .order('task_type');
  if (error) return NextResponse.json({ error: 'Unable to load host task catalog.' }, { status: 500 });
  return NextResponse.json({ items: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!EDITORS.includes(staff.profile.role)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });
  const b = await req.json().catch(() => null) as any;
  const amount = Number(b?.amount);
  const currency = String(b?.currency || 'USD').toUpperCase();
  const taskType = String(b?.task_type || '');
  const title = String(b?.title || '').trim();
  if (!TASK_TYPES.includes(taskType) || !title || title.length > 120 || !Number.isFinite(amount) || amount < 0 || !['USD','SAR'].includes(currency))
    return NextResponse.json({ error: 'Provide a valid task type, title, non-negative amount, and USD or SAR currency.' }, { status: 400 });
  const s = getSupabaseAdmin();
  const { data, error } = await s.from('host_task_catalog').insert({
    task_type: taskType, title, description: b.description ? String(b.description).slice(0,1000) : null,
    amount, currency, active: b.active !== false, created_by: staff.profile.id, updated_by: staff.profile.id
  }).select('id,task_type,title,description,amount,currency,active,created_at,updated_at').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'A price entry already exists for this task type.' : 'Unable to create task price.' }, { status: error.code === '23505' ? 409 : 500 });
  await s.from('audit_logs').insert({ actor_id: staff.profile.id, action: 'HOST_TASK_PRICE_CREATED', entity_type: 'host_task_catalog', entity_id: data.id, after_data: data });
  revalidatePath('/admin/host-tasks'); revalidatePath('/admin/operations'); revalidatePath('/admin/finance');
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!EDITORS.includes(staff.profile.role)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });
  const b = await req.json().catch(() => null) as any;
  if (!b?.id) return NextResponse.json({ error: 'Catalog item id is required.' }, { status: 400 });
  const s = getSupabaseAdmin();
  const { data: before, error: readError } = await s.from('host_task_catalog').select('*').eq('id', b.id).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Unable to read catalog item.' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Catalog item not found.' }, { status: 404 });
  const update: any = { updated_by: staff.profile.id, updated_at: new Date().toISOString() };
  if (b.title !== undefined) { const title = String(b.title).trim(); if (!title || title.length > 120) return NextResponse.json({ error: 'Invalid title.' }, { status: 400 }); update.title = title; }
  if (b.description !== undefined) update.description = b.description ? String(b.description).slice(0,1000) : null;
  if (b.amount !== undefined) { const amount = Number(b.amount); if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 }); update.amount = amount; }
  if (b.currency !== undefined) { const currency = String(b.currency).toUpperCase(); if (!['USD','SAR'].includes(currency)) return NextResponse.json({ error: 'Invalid currency.' }, { status: 400 }); update.currency = currency; }
  if (b.active !== undefined) { if (typeof b.active !== 'boolean') return NextResponse.json({ error: 'Invalid active flag.' }, { status: 400 }); update.active = b.active; }
  const { data, error } = await s.from('host_task_catalog').update(update).eq('id', b.id).select('id,task_type,title,description,amount,currency,active,created_at,updated_at').single();
  if (error) return NextResponse.json({ error: 'Unable to update task price.' }, { status: 500 });
  await s.from('audit_logs').insert({ actor_id: staff.profile.id, action: 'HOST_TASK_PRICE_UPDATED', entity_type: 'host_task_catalog', entity_id: data.id, before_data: before, after_data: data });
  revalidatePath('/admin/host-tasks'); revalidatePath('/admin/operations'); revalidatePath('/admin/finance');
  return NextResponse.json({ item: data });
}
