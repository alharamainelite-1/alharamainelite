'use client';
import {useState} from 'react'; import type {FormEvent} from 'react'; import {useRouter} from 'next/navigation'; import {getSupabaseBrowser} from '@/lib/supabase/browser';
export function PartnerRegistrationForm(){
  const router=useRouter();
  const[form,setForm]=useState({fullName:'',email:'',password:'',whatsapp:'',country:''});
  const[error,setError]=useState(''); const[message,setMessage]=useState(''); const[loading,setLoading]=useState(false);
  const update=(k:keyof typeof form,v:string)=>setForm(f=>({...f,[k]:v}));
  async function submit(e:FormEvent){
    e.preventDefault();setError('');setMessage('');setLoading(true);
    try{
      const supabase=getSupabaseBrowser();
      const {data,error:signUpError}=await supabase.auth.signUp({
        email:form.email,password:form.password,
        options:{data:{full_name:form.fullName},emailRedirectTo:window.location.origin+'/auth/confirm?next=/partner/dashboard'}
      });
      if(signUpError)throw signUpError;
      const identities=data.user?.identities||[];
      if(data.user&&identities.length>0){
        const profile=await fetch('/api/partners/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
          fullName:form.fullName,email:form.email,whatsapp:form.whatsapp,country:form.country,userId:data.user.id
        })});
        const profileData=await profile.json();
        if(!profile.ok)throw new Error(profileData.error||'Unable to create your partner profile.');
      }
      if(data.session){router.push('/partner/dashboard');return;}
      setMessage('Your partner account has been created. Please check your email and confirm your address before signing in.');
      setForm(f=>({...f,password:''}));
    }catch(e){setError(e instanceof Error?e.message:'Unable to create your partner account.')}finally{setLoading(false)}
  }
  return <form onSubmit={submit} className="mt-7 grid gap-5">
    <label>Full name<input required value={form.fullName} onChange={e=>update('fullName',e.target.value)} autoComplete="name"/></label>
    <label>Email<input required type="email" value={form.email} onChange={e=>update('email',e.target.value)} autoComplete="email"/></label>
    <label>Password<input required minLength={8} type="password" value={form.password} onChange={e=>update('password',e.target.value)} autoComplete="new-password"/></label>
    <label>WhatsApp number<input required value={form.whatsapp} onChange={e=>update('whatsapp',e.target.value)} placeholder="+44…" autoComplete="tel"/></label>
    <label>Country<input required value={form.country} onChange={e=>update('country',e.target.value)} autoComplete="country-name"/></label>
    {error&&<div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {message&&<div role="status" className="border border-forest/10 bg-forest/5 p-4 text-sm text-forest">{message}</div>}
    <button disabled={loading} className="btn btn-primary w-full">{loading?'Creating your partner account…':'Become a Partner'}</button>
    <a href="/partner-login" className="text-center text-sm font-semibold text-gold">Already a partner? Sign in</a>
  </form>
}
