import { NextResponse } from 'next/server';
import { getSupabasePublicServer } from '@/lib/supabase/server';

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
  if(!data?.ok) return NextResponse.json({error:data?.error||'Invalid link.'},{status: data?.error==='invalid_or_used_link'?410:400});
  return NextResponse.json({ok:true});
}
