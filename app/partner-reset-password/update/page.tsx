'use client';

import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {getSupabaseBrowser} from '@/lib/supabase/browser';

export default function PartnerPasswordResetUpdatePage(){
 const router=useRouter();
 const[password,setPassword]=useState('');
 const[confirm,setConfirm]=useState('');
 const[msg,setMsg]=useState('');
 const[error,setError]=useState('');
 const[ready,setReady]=useState(false);
 const[loading,setLoading]=useState(false);

 useEffect(()=>{
  let active=true;
  const supabase=getSupabaseBrowser();
  const check=async()=>{
   const{data:{session}}=await supabase.auth.getSession();
   if(!session){if(active)setError('This reset link is invalid or has expired. Please request a new one.');return}
   const{data:partner}=await supabase.from('influencer_partners').select('id,status').eq('user_id',session.user.id).maybeSingle();
   if(!partner){if(active)setError('This password reset page is for partner accounts only.');return}
   if(partner.status==='SUSPENDED'){if(active)setError('This partner account is suspended. Please contact ALHARAMAIN ELITE support.');return}
   if(active)setReady(true);
  };
  check();
  return()=>{active=false};
 },[]);

 async function submit(e:FormEvent){
  e.preventDefault(); setMsg(''); setError('');
  if(password.length<8){setError('Password must be at least 8 characters.');return}
  if(password!==confirm){setError('Passwords do not match.');return}
  setLoading(true);
  try{
   const{error:updateError}=await getSupabaseBrowser().auth.updateUser({password});
   if(updateError) throw updateError;
   setMsg('Your password has been changed successfully. You can now sign in.');
   setPassword(''); setConfirm('');
   setTimeout(()=>router.replace('/partner-login'),1200);
  }catch(err){setError(err instanceof Error?err.message:'Unable to change your password.')}finally{setLoading(false)}
 }
 return <main className="min-h-screen bg-ivory"><section className="section"><div className="container max-w-md"><div className="card p-8 md:p-10"><div className="eyebrow">ALHARAMAIN ELITE Partner Program</div><h1 className="serif mt-4 text-4xl text-forest">Choose a new password.</h1>{!ready&&!msg?<div className="mt-6 border border-forest/10 bg-white p-4 text-sm leading-6 text-forest/65">{error||'Checking your secure reset link…'}</div>:<form onSubmit={submit} className="mt-7 grid gap-5"><label>New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} /></label><label>Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>{msg&&<div className="border border-forest/10 bg-white p-4 text-sm leading-6 text-forest">{msg}</div>}{error&&<div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}<button disabled={loading} className="btn btn-primary w-full">{loading?'Saving…':'Set new password'}</button></form>}</div></div></section></main>
}