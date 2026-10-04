'use client';
import { useState } from 'react';

const labels = [
  ['Accommodation','Hoyga iyo hoteellada','الفنادق والإقامة','accommodation'],
  ['Transportation','Gaadiidka','النقل والمواصلات','transportation'],
  ['Host & support','Martigeliyaha iyo taageerada','المضيف والمتابعة','host'],
  ['Umrah organization','Qabanqaabada Cumrada','تنظيم العمرة والزيارات','umrah_organization'],
  ['Customer service','Adeegga macaamiisha','خدمة العملاء','customer_support'],
  ['Overall experience','Khibradda guud','التجربة بشكل عام','overall'],
] as const;

export default function ReviewForm({token}:{token:string}) {
  const [lang,setLang]=useState<'en'|'so'|'ar'>('en');
  const [ratings,setRatings]=useState<Record<string,number>>({});
  const [review,setReview]=useState('');
  const [name,setName]=useState('');
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  const [imageConsent,setImageConsent]=useState(false);
  const t={en:{name:'Name to display (optional)',review:'Your review',placeholder:'Tell us about your experience...',send:'Submit review',success:'Thank you. Your review was received and is awaiting moderation.',consent:'I consent to publishing an attached photo (photo upload will be requested separately).',choose:'Choose language'},so:{name:'Magaca la muujinayo (ikhtiyaari)',review:'Faalladaada',placeholder:'Nooga warran khibraddaada...',send:'Dir faallada',success:'Mahadsanid. Faalladaada waa la helay waxayna sugaysaa dib-u-eegis.',consent:'Waxaan oggolahay in sawirka la lifaaqay la daabaco (sawir gelintu gooni ayay u baahan tahay).',choose:'Dooro luqadda'},ar:{name:'الاسم الذي سيظهر (اختياري)',review:'اكتب تقييمك',placeholder:'شاركنا تجربتك...',send:'إرسال التقييم',success:'شكرًا لك. وصل تقييمك وهو بانتظار المراجعة.',consent:'أوافق على نشر الصورة المرفقة (سيتم توفير رفع الصورة بشكل منفصل).',choose:'اختر اللغة'}}[lang];
  const submit=async()=>{setBusy(true);setError('');try{const res=await fetch('/api/reviews/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,reviewText:review,ratings,displayName:name,imageConsent})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Submission failed');setDone(true);}catch(e){setError(e instanceof Error?e.message:'Submission failed');}finally{setBusy(false);}};
  if(done)return <div className="py-8 text-center"><h2 className="serif text-2xl">{t.success}</h2></div>;
  return <div dir={lang==='ar'?'rtl':'ltr'} className="space-y-6">
    <div><label className="mb-2 block text-xs text-[#063F35]/70">{t.choose}</label><select value={lang} onChange={e=>setLang(e.target.value as 'en'|'so'|'ar')} className="w-full rounded-lg border border-[#063F35]/15 bg-white p-3"><option value="en">English</option><option value="so">Soomaali</option><option value="ar">العربية</option></select></div>
    {labels.map(([en,so,ar,key])=><fieldset key={key}><legend className="mb-2 text-sm font-semibold">{lang==='en'?en:lang==='so'?so:ar}</legend><div className="flex gap-2" aria-label={en}>{[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>setRatings(old=>({...old,[key]:n}))} aria-label={String(n)} className={'text-3xl '+((ratings[key]||0)>=n?'text-[#C9A227]':'text-gray-300')}>★</button>)}</div></fieldset>)}
    <div><label className="mb-2 block text-sm font-semibold">{t.name}</label><input value={name} onChange={e=>setName(e.target.value)} maxLength={100} className="w-full rounded-lg border border-[#063F35]/15 bg-white p-3"/></div>
    <div><label className="mb-2 block text-sm font-semibold">{t.review}</label><textarea value={review} onChange={e=>setReview(e.target.value)} minLength={10} maxLength={3000} rows={5} placeholder={t.placeholder} className="w-full rounded-lg border border-[#063F35]/15 bg-white p-3"/></div>
    <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" checked={imageConsent} onChange={e=>setImageConsent(e.target.checked)}/><span>{t.consent}</span></label>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="button" disabled={busy||review.trim().length<10||Object.keys(ratings).length===0} onClick={submit} className="w-full rounded-lg bg-[#063F35] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?'…':t.send}</button>
  </div>;
}
