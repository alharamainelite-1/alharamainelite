import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getSupabaseAdmin, getSupabasePublicServer } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  if (token.length < 24 || token.length > 256) return NextResponse.json({ error: 'Invalid link.' }, { status: 400 });
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { data, error } = await getSupabaseAdmin().from('review_invitations')
    .select('language,expires_at,submitted_at').eq('token_hash', tokenHash).maybeSingle();
  if (error || !data || data.submitted_at || new Date(data.expires_at).getTime() <= Date.now())
    return NextResponse.json({ error: 'This review link is invalid, expired, or already used.' }, { status: 410 });
  return NextResponse.json({ language: data.language });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as {
    token?: string; reviewText?: string; ratings?: Record<string, number>;
    displayName?: string; imagePath?: string; imageConsent?: boolean;
  } | null;
  if (!body?.token || typeof body.reviewText!=='string' || !body.ratings)
    return NextResponse.json({error:'Invalid submission.'},{status:400});
  const {data,error}=await getSupabasePublicServer().rpc('submit_guest_review',{
    p_token:body.token,p_review_text:body.reviewText,p_service_ratings:body.ratings,
    p_display_name:body.displayName||null,p_image_path:body.imagePath||null,
    p_image_consent:body.imageConsent===true
  });
  if(error) return NextResponse.json({error:'Could not submit review.'},{status:500});
  if(!data?.ok) return NextResponse.json({error:data?.error||'Invalid link.',},{status: data?.error==='invalid_or_used_link'?410:400});
  return NextResponse.json({ok:true});
}