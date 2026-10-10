import { NextResponse } from 'next/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUCKET = 'journey-confirmations';
const MAX_BYTES = 15 * 1024 * 1024;

async function authorized() {
  const staff = await getCurrentStaff();
  if (!staff) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) };
  if (staff.profile.role !== 'SUPER_ADMIN') return { error: NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 }) };
  return { staff };
}

export async function POST(request: Request) {
  const access = await authorized();
  if (access.error) return access.error;

  const form = await request.formData().catch(() => null);
  const documentId = String(form?.get('documentId') || '');
  const file = form?.get('file');
  if (!UUID.test(documentId) || !(file instanceof File)) {
    return NextResponse.json({ error: 'A valid confirmation document and PDF file are required.' }, { status: 400 });
  }
  if (file.size < 8 || file.size > MAX_BYTES || (file.type && file.type !== 'application/pdf')) {
    return NextResponse.json({ error: 'Upload a PDF file no larger than 15 MB.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') {
    return NextResponse.json({ error: 'The uploaded file is not a valid PDF.' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: document, error: documentError } = await db
    .from('journey_confirmation_documents')
    .select('id,booking_id,version,document_status')
    .eq('id', documentId)
    .maybeSingle();
  if (documentError || !document) return NextResponse.json({ error: 'Confirmation document not found.' }, { status: 404 });
  if (document.document_status !== 'GENERATED') {
    return NextResponse.json({ error: 'Only a generated, not-yet-sent confirmation can be uploaded.' }, { status: 409 });
  }

  const path = document.booking_id + '/' + document.id + '.pdf';
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true,
    cacheControl: '3600',
  });
  if (uploadError) return NextResponse.json({ error: 'Could not store the PDF securely.' }, { status: 500 });

  const { error: updateError } = await db.from('journey_confirmation_documents')
    .update({ pdf_path: path })
    .eq('id', document.id)
    .eq('document_status', 'GENERATED');
  if (updateError) {
    await db.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: 'The PDF was uploaded but its record could not be updated.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, documentId: document.id, version: document.version });
}

export async function GET(request: Request) {
  const access = await authorized();
  if (access.error) return access.error;

  const documentId = new URL(request.url).searchParams.get('documentId') || '';
  if (!UUID.test(documentId)) return NextResponse.json({ error: 'A valid confirmation document is required.' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: document, error } = await db.from('journey_confirmation_documents')
    .select('pdf_path').eq('id', documentId).maybeSingle();
  if (error || !document) return NextResponse.json({ error: 'Confirmation document not found.' }, { status: 404 });
  if (!document.pdf_path) return NextResponse.json({ error: 'No saved PDF is available for this version yet.' }, { status: 404 });

  const { data, error: signedUrlError } = await db.storage.from(BUCKET).createSignedUrl(document.pdf_path, 60);
  if (signedUrlError || !data?.signedUrl) return NextResponse.json({ error: 'Could not open the saved PDF.' }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
