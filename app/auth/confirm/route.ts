import {NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://vpeagpnsljoaaafrtbed.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||['sb_publishable_','x3cFwO1f_','MB4mnfS2uqNfg_9CvxRZE_'].join('');

function safeNext(value:string|null){return value&&value.startsWith('/')&&!value.startsWith('//')?value:'/partner/dashboard'}

export async function GET(req:Request){
  const url=new URL(req.url),code=url.searchParams.get('code'),tokenHash=url.searchParams.get('token_hash'),type=url.searchParams.get('type')||'email',next=safeNext(url.searchParams.get('next'));
  const store=await cookies();
  const supabase=createServerClient(SUPABASE_URL,KEY,{cookies:{getAll(){return store.getAll()},setAll(items){items.forEach(({name,value,options})=>store.set(name,value,options))}}});
  let error:string|null=null;
  if(code){const result=await supabase.auth.exchangeCodeForSession(code);error=result.error?.message||null}
  else if(tokenHash){const result=await supabase.auth.verifyOtp({token_hash:tokenHash,type:type as 'email'});error=result.error?.message||null}
  else error='Missing confirmation code.';
  if(error)return NextResponse.redirect(new URL('/partner-login?error=confirmation',url.origin));
  return NextResponse.redirect(new URL(next,url.origin));
}
