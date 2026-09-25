import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { areaForAdminPath, roleCanAccess } from '@/lib/admin-access';


function urlForPublic(req:NextRequest){return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co'}
function keyForPublic(){return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_','x3cFwO1f_','MB4mnfS2uqNfg_9CvxRZE_'].join('')}

async function partnerSlugExists(req:NextRequest, slug:string){
  const client=createServerClient(urlForPublic(req),keyForPublic(),{cookies:{getAll(){return req.cookies.getAll()},setAll(){}}});
  for(let attempt=0;attempt<2;attempt++){
    try{
      const {data,error}=await client.rpc('partner_slug_exists',{p_slug:slug});
      if(!error && data===true)return true;
    }catch{}
    if(attempt===0)await new Promise(resolve=>setTimeout(resolve,150));
  }
  return false;
}

function createNonce(){return btoa(crypto.randomUUID()).replace(/=+$/,'');}

function applySecurityHeaders(res:NextResponse,nonce:string){
  const supabaseOrigin=process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
  const csp=[
    "default-src 'self'","base-uri 'self'","object-src 'none'","frame-ancestors 'none'","form-action 'self'",
    "script-src 'self' 'nonce-"+nonce+"' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://www.google-analytics.com",
    "font-src 'self' data:","connect-src 'self' "+supabaseOrigin+" https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
    "frame-src 'self'","worker-src 'self' blob:"
  ].join('; ');
  res.headers.set('Content-Security-Policy',csp);
  res.headers.set('X-Frame-Options','DENY');
  res.headers.set('X-Content-Type-Options','nosniff');
  res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.headers.set('Cross-Origin-Opener-Policy','same-origin');
  res.headers.set('x-nonce',nonce);
}

export async function middleware(req: NextRequest){
  const originalPath = req.nextUrl.pathname;
  const localeMatch = originalPath.match(/^\/(so|ar)(?=\/|$)/);
  const locale = localeMatch?.[1] === 'so' || localeMatch?.[1] === 'ar' ? localeMatch[1] : 'en';
  const publicPath = localeMatch ? (originalPath.slice(3) || '/') : originalPath;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-he-locale', locale);
  requestHeaders.set('x-he-path', publicPath);
  const nonce=createNonce();
  requestHeaders.set('x-nonce',nonce);

  let res: NextResponse;
  if (localeMatch) {
    req.cookies.set('he_locale', locale);
    res = NextResponse.rewrite(new URL(publicPath, req.url), { request: { headers: requestHeaders } });
    res.cookies.set('he_locale', locale, { path: '/', maxAge: 31536000 });
  } else {
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }
  applySecurityHeaders(res,nonce);

  if(originalPath==='/favicon.ico') return NextResponse.redirect(new URL('/brand/alharamainelite-logo.png',req.url));
  const candidate=publicPath.replace(/^\//,'');
  const reserved=['packages','experience','womens-umrah','makkah','madinah','jeddah','hotels','transportation','about','reviews','faq','request-journey','request-success','contact','umrah-from-usa','umrah-from-uk','umrah-from-canada','partner-program','partner-login','partner','admin','api'];
  if(candidate && !candidate.includes('/') && /^[a-z0-9-]{2,60}$/.test(candidate) && !reserved.includes(candidate)){
    if(await partnerSlugExists(req,candidate)){
      res=NextResponse.rewrite(new URL('/',req.url),{request:{headers:requestHeaders}});
      res.cookies.set('he_partner_ref',candidate,{path:'/',maxAge:315360000,httpOnly:true,sameSite:'lax'});
      applySecurityHeaders(res,nonce);
    }
  }

  if(publicPath.startsWith('/admin') && !publicPath.startsWith('/admin/login')){
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_', 'x3cFwO1f_', 'MB4mnfS2uqNfg_9CvxRZE_'].join('');
    const supabase=createServerClient(url,key,{cookies:{getAll(){return req.cookies.getAll()},setAll(cookies){cookies.forEach(({name,value})=>req.cookies.set(name,value));res=NextResponse.next({request:{headers:requestHeaders}});cookies.forEach(({name,value,options})=>res.cookies.set(name,value,options));applySecurityHeaders(res,nonce);}}});
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if(!userId)return NextResponse.redirect(new URL('/admin/login',req.url));
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',userId).single();
    const area=areaForAdminPath(publicPath);
    if(area && (!profile || !roleCanAccess(profile.role, area)))return NextResponse.redirect(new URL('/admin',req.url));
    res.headers.set('Cache-Control','private, no-store');
  }
  return res;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
