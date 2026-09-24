import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {enforceRateLimit,rateLimitResponse} from '@/lib/security/rate-limit';

function slugify(v:string){return v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'partner'}
function isUuid(v:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}

export async function POST(req:Request){
  try{
    const b=await req.json();
    const fullName=String(b.fullName||'').trim(),email=String(b.email||'').trim().toLowerCase(),whatsapp=String(b.whatsapp||'').trim(),country=String(b.country||'').trim(),userId=String(b.userId||'').trim();
    if(fullName.length<2||fullName.length>120||!email.includes('@')||whatsapp.length<7||whatsapp.length>30||country.length<2||country.length>80||!isUuid(userId))
      return NextResponse.json({error:'Please check the submitted details.'},{status:400});

    const limiter=await enforceRateLimit(req,'partner-register',5,3600);
    if(limiter.failed)return NextResponse.json({error:'Service temporarily unavailable. Please try again shortly.'},{status:503});
    if(!limiter.allowed)return rateLimitResponse(limiter.retryAfterSeconds);

    const s=getSupabaseAdmin();
    const {data:{user},error:userError}=await s.auth.admin.getUserById(userId);
    if(userError||!user||user.email?.toLowerCase()!==email)return NextResponse.json({error:'We could not complete your partner registration. Please try again.'},{status:400});

    const existing=await s.from('influencer_partners').select('id').eq('user_id',user.id).maybeSingle();
    if(existing.data)return NextResponse.json({ok:true},{status:200});

    let slug=slugify(fullName),suffix=1;
    while(true){
      const {data}=await s.from('influencer_partners').select('id').eq('slug',slug).maybeSingle();
      if(!data)break;
      suffix+=1;slug=slugify(fullName)+'-'+suffix;
      if(suffix>50)return NextResponse.json({error:'Unable to generate a partner link right now.'},{status:500});
    }

    const {error}=await s.from('influencer_partners').insert({user_id:user.id,full_name:fullName,email,whatsapp,country,slug,status:'PENDING'});
    if(error){
      if(error.code==='23505')return NextResponse.json({ok:true},{status:200});
      console.error('partner_profile_create_error',error);
      return NextResponse.json({error:'Unable to create partner profile.'},{status:500});
    }
    return NextResponse.json({slug},{status:201});
  }catch(e){
    console.error('partner_register_error',e);
    return NextResponse.json({error:'Unable to create your partner account right now.'},{status:500});
  }
}
