import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get('token') || '');
  const file = form.get('photo');
  const consent = form.get('imageConsent') === 'true';
  if (!consent) return NextResponse.json({ error: 'Photo publication consent is required.' }, { status: 400 });
  if (token.length < 24 || token.length > 256 || !(file instanceof File))
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  if (file.size < 1 || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Image must be 5 MB or smaller.' }, { status: 413 });
  const types: Record<string,string> = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };
  const ext = types[file.type];
  if (!ext) return NextResponse.json({ error: 'Use a JPG, PNG, or WebP image.' }, { status: 415 });
  const supabase = getSupabaseAdmin();
  const token_hash = createHash('sha256').update(token).digest('hex');
  const { data: invite, error } = await supabase.from('review_invitations')
    .select('id,booking_id,expires_at,submitted_at').eq('token_hash',token_hash).maybeSingle();
  if (error || !invite || invite.submitted_at || new Date(invite.expires_at).getTime() <= Date.now())
    return NextResponse.json({ error: 'This review link is invalid, expired, or already used.' }, { status: 410 });
  const { data: booking } = await supabase.from('bookings').select('status').eq('id',invite.booking_id).maybeSingle();
  if (booking?.status !== 'COMPLETED') return NextResponse.json({ error: 'Journey is not completed.' }, { status: 409 });
  const bucket = 'guest-review-photos';
  const created = await supabase.storage.createBucket(bucket,{public:false,fileSizeLimit:5*1024*1024,allowedMimeTypes:Object.keys(types)});
  if (created.error && !/already exists/i.test(created.error.message))
    return NextResponse.json({ error: 'Photo storage is unavailable.' }, { status: 503 });
  const path = invite.booking_id + '/' + randomUUID() + '.' + ext;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false});
  if (uploadError) return NextResponse.json({ error: 'Could not upload photo.' }, { status: 500 });
  return NextResponse.json({ path });
}
