import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const access: Record<string,string[]> = {
  '/admin/requests':['SUPER_ADMIN','ADMIN','SALES'],
  '/admin/bookings':['SUPER_ADMIN','ADMIN','SALES','FINANCE'],
  '/admin/groups':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  '/admin/guests':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  '/admin/operations':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  '/admin/hosts':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS','HOST'],
  '/admin/hotels':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  '/admin/transportation':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  '/admin/train':['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'],
  '/admin/payments':['SUPER_ADMIN','ADMIN','FINANCE'],
  '/admin/expenses':['SUPER_ADMIN','ADMIN','FINANCE'],
  '/admin/reports':['SUPER_ADMIN','ADMIN','FINANCE'],
  '/admin/communications':['SUPER_ADMIN','ADMIN','SALES'],
  '/admin/reviews':['SUPER_ADMIN','ADMIN','SALES'],
  '/admin/settings':['SUPER_ADMIN','ADMIN'],
};

export async function middleware(req: NextRequest){
  let res=NextResponse.next({request:req});
  res.headers.set('x-content-type-options','nosniff');
  res.headers.set('referrer-policy','strict-origin-when-cross-origin');
  res.headers.set('permissions-policy','camera=(), microphone=(), geolocation=()');
  if(req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')){
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpeagpnsljoaaafrtbed.supabase.co';
    const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['sb_publishable_', 'x3cFwO1f_', 'MB4mnfS2uqNfg_9CvxRZE_'].join('');
    const supabase=createServerClient(url,key,{cookies:{getAll(){return req.cookies.getAll()},setAll(cookies){cookies.forEach(({name,value,options})=>req.cookies.set(name,value));res=NextResponse.next({request:req});cookies.forEach(({name,value,options})=>res.cookies.set(name,value,options));}}});
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return NextResponse.redirect(new URL('/admin/login',req.url));
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
    const rule=Object.entries(access).find(([path])=>req.nextUrl.pathname===path || req.nextUrl.pathname.startsWith(path+'/'));
    if(rule && (!profile || !rule[1].includes(profile.role))) return NextResponse.redirect(new URL('/admin',req.url));
  }
  return res;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
