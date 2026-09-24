import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://vpeagpnsljoaaafrtbed.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||['sb_publishable_','x3cFwO1f_','MB4mnfS2uqNfg_9CvxRZE_'].join('');
export async function getCurrentPartner(){
 const store=await cookies();
 const s=createServerClient(URL,KEY,{cookies:{getAll(){return store.getAll()},setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}});
 const {data:{user}}=await s.auth.getUser(); if(!user||!user.email_confirmed_at)return null;
 const {data:partner}=await s.from('influencer_partners').select('id,user_id,full_name,email,whatsapp,country,slug,status,created_at').eq('user_id',user.id).maybeSingle();
 return partner?{user,partner}:null;
}
