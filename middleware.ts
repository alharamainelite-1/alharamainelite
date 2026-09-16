import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest){
  let res=NextResponse.next({request:req});
  res.headers.set('x-content-type-options','nosniff');
  res.headers.set('referrer-policy','strict-origin-when-cross-origin');
  res.headers.set('permissions-policy','camera=(), microphone=(), geolocation=()');
  if(req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')){
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(url&&key){
      const supabase=createServerClient(url,key,{cookies:{getAll(){return req.cookies.getAll()},setAll(cookies){cookies.forEach(({name,value,options})=>req.cookies.set(name,value));res=NextResponse.next({request:req});cookies.forEach(({name,value,options})=>res.cookies.set(name,value,options));}}});
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) return NextResponse.redirect(new URL('/admin/login',req.url));
    }
  }
  return res;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
