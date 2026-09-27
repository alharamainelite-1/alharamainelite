'use client';

import {FormEvent, useEffect, useState} from 'react';
import {getSupabaseBrowser} from '@/lib/supabase/browser';
import {SITE_URL} from '@/lib/seo';

const COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = 'alharamainelite_partner_reset_cooldown_until';

export function PartnerPasswordResetRequest(){
 const[email,setEmail]=useState('');
 const[msg,setMsg]=useState('');
 const[error,setError]=useState('');
 const[loading,setLoading]=useState(false);
 const[cooldown,setCooldown]=useState(0);

 useEffect(()=>{
  const sync=()=>{
   const until=Number(window.localStorage.getItem(COOLDOWN_KEY)||0);
   setCooldown(Math.max(0,Math.ceil((until-Date.now())/1000)));
  };
  sync();
  const timer=window.setInterval(sync,1000);
  return()=>window.clearInterval(timer);
 },[]);

 function startCooldown(seconds=COOLDOWN_SECONDS){
  const until=Date.now()+seconds*1000;
  window.localStorage.setItem(COOLDOWN_KEY,String(until));
  setCooldown(seconds);
 }

 function isRateLimitError(value:unknown){
  const text=value instanceof Error?value.message:String(value||'');
  return /rate.?limit|429|too many requests/i.test(text);
 }

 async function submit(e:FormEvent){
  e.preventDefault();
  setMsg('');
  setError('');

  if(cooldown>0){
   setError(`Please wait ${cooldown} seconds before requesting another reset link.`);
   return;
  }

  const normalized=email.trim().toLowerCase();
  if(!normalized)return;

  setLoading(true);
  try{
   const supabase=getSupabaseBrowser();
   const{error:resetError}=await supabase.auth.resetPasswordForEmail(normalized,{
    redirectTo:`${SITE_URL}/auth/callback?next=/partner-reset-password/update`
   });

   if(resetError){
    if(isRateLimitError(resetError)){
     startCooldown(60);
     setError('Too many reset requests were sent recently. Please wait a little before trying again. / تم إرسال طلبات كثيرة مؤخرًا. يرجى الانتظار قليلًا قبل المحاولة مرة أخرى.');
     return;
    }
    throw resetError;
   }

   startCooldown();
   setMsg('If this email belongs to a partner account, a secure reset link has been sent. Please check your inbox and spam folder. / إذا كان هذا البريد مرتبطًا بحساب شريك، فسيتم إرسال رابط آمن لإعادة تعيين كلمة المرور. تحقق من البريد الوارد ومجلد الرسائل غير المرغوب فيها.');
  }catch(err){
   if(isRateLimitError(err)){
    startCooldown(60);
    setError('Too many reset requests were sent recently. Please wait a little before trying again. / تم إرسال طلبات كثيرة مؤخرًا. يرجى الانتظار قليلًا قبل المحاولة مرة أخرى.');
   }else{
    setError(err instanceof Error?err.message:'Unable to send the reset link right now. / تعذر إرسال رابط إعادة التعيين حاليًا.');
   }
  }finally{
   setLoading(false);
  }
 }

 const buttonLabel=loading?'Sending…':cooldown>0?`Try again in ${cooldown}s`:'Send reset link';

 return <form onSubmit={submit} className="mt-7 grid gap-5">
  <label>Email
   <input required type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}} />
  </label>
  {msg&&<div className="border border-forest/10 bg-white p-4 text-sm leading-6 text-forest">{msg}</div>}
  {error&&<div className="border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</div>}
  {cooldown>0&&<div className="text-center text-xs leading-5 text-forest/60">For security, another reset request is temporarily disabled. / لأسباب أمنية، تم تعطيل طلب إعادة التعيين مؤقتًا.</div>}
  <button type="submit" disabled={loading||cooldown>0} className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">{buttonLabel}</button>
  <a href="/partner-login" className="text-center text-sm font-semibold text-gold">Back to partner login</a>
 </form>
}