import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://vpeagpnsljoaaafrtbed.supabase.co';
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||['sb_publishable_','x3cFwO1f_','MB4mnfS2uqNfg_9CvxRZE_'].join('');

export async function GET(request:Request){
 const url=new URL(request.url);
 const code=url.searchParams.get('code');
 const rawNext=url.searchParams.get('next')||'/';
 const next=rawNext.startsWith('/')&&!rawNext.startsWith('//')?rawNext:'/';
 if(!code)return NextResponse.redirect(new URL('/partner-login?error=invalid_reset_link',url.origin));
 const cookieStore=await cookies();
 const supabase=createServerClient(SUPABASE_URL,SUPABASE_KEY,{cookies:{
  getAll(){return cookieStore.getAll()},
  setAll(items){items.forEach(({name,value,options})=>cookieStore.set(name,value,options))}
 }});
 const{error}=await supabase.auth.exchangeCodeForSession(code);
 if(error)return NextResponse.redirect(new URL('/partner-login?error=invalid_or_expired_reset_link',url.origin));
 return NextResponse.redirect(new URL(next,url.origin));
}