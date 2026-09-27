'use client';

import {useState} from 'react';
import {getSupabaseBrowser} from '@/lib/supabase/browser';
import {SITE_URL} from '@/lib/seo';

export function PartnerPasswordResetRequest(){
 const[email,setEmail]=useState('');
 const[msg,setMsg]=useState('');
 const[error,setError]=useState('');
 const[loading,setLoading]=useState(false);

 async function submit(e:React.FormEvent){
  e.preventDefault(); setMsg(''); setError(''); setLoading(true);
  try{
   const supabase=getSupabaseBrowser();
   const normalized=email.trim().toLowerCase();
   const{error:resetError}=await supabase.auth.resetPasswordForEmail(normalized,{redirectTo:`${SITE_URL}/partner-reset-password/update`});
   if(resetError) throw resetError;
   setMsg('If this email belongs to a partner account, a secure reset link has been sent. Please check your inbox and spam folder.');
  }catch(err){
   setError(err instanceof Error?err.message:'Unable to send the reset link right now.');
  }finally{setLoading(false)}
 }
 return <form onSubmit={submit} className="mt-7 grid gap-5">
  <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
  {msg&&<div className="border border-forest/10 bg-white p-4 text-sm leading-6 text-forest">{msg}</div>}
  {error&&<div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  <button disabled={loading} className="btn btn-primary w-full">{loading?'Sending…':'Send reset link'}</button>
  <a href="/partner-login" className="text-center text-sm font-semibold text-gold">Back to partner login</a>
 </form>
}