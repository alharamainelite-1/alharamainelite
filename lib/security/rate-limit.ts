import {getSupabaseAdmin} from '@/lib/supabase/server';

function firstForwardedIp(value:string|null){return value?.split(',')[0]?.trim()||null}

export function getClientIp(req:Request){
  return firstForwardedIp(req.headers.get('x-forwarded-for')) || req.headers.get('x-real-ip') || 'unknown';
}

export async function enforceRateLimit(req:Request,scope:string,limit:number,windowSeconds:number,identity?:string){
  const ip=getClientIp(req);
  const key=scope+':ip:'+ip+(identity?':'+identity.toLowerCase().trim():'');
  const s=getSupabaseAdmin();
  const {data,error}=await s.rpc('consume_rate_limit',{p_key:key,p_limit:limit,p_window_seconds:windowSeconds});
  if(error || !data?.[0]) return {allowed:false,retryAfterSeconds:60,failed:true};
  return {allowed:Boolean(data[0].allowed),retryAfterSeconds:Number(data[0].retry_after_seconds||0),failed:false};
}

export function rateLimitResponse(retryAfterSeconds:number){
  return Response.json({error:'Too many requests. Please try again shortly.'},{status:429,headers:{'Retry-After':String(Math.max(1,retryAfterSeconds)),'Cache-Control':'no-store'}});
}
