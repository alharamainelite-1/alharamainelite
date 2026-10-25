'use client';
import { useState } from 'react';
type RequestRow={id:string;reference:string;full_name:string;status:string;booking_id:string|null;quote_amount:number|null;quote_currency:string;adults:number;children_ages:number[];infant_ages_months:number[]};
type PackageRow={id:string;name:string;slug:string;price:number;currency:string};
export function FamilyFriendsConversionPanel({requests,packages}:{requests:RequestRow[];packages:PackageRow[]}) {
 const [selected,setSelected]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState('');
 const [messages,setMessages]=useState<Record<string,{text:string;ok:boolean}>>({});
 const eligible=requests.filter(q=>q.status==='CONFIRMED');
 async function convert(q:RequestRow) {
  const packageId=selected[q.id];
  if(!packageId){setMessages(v=>({...v,[q.id]:{text:'اختر الباقة المناسبة أولًا.',ok:false}}));return;}
  if(q.quote_amount===null||Number(q.quote_amount)<=0){setMessages(v=>({...v,[q.id]:{text:'لا يوجد سعر معتمد موجب لهذا الطلب.',ok:false}}));return;}
  if(!window.confirm('سيتم إنشاء حجز غير مدفوع بحالة طلب جديد وربطه بهذا الطلب. لن يتم تسجيل أي دفعة. هل تريد المتابعة؟'))return;
  setBusy(q.id);setMessages(v=>({...v,[q.id]:{text:'جارٍ إنشاء الحجز…',ok:false}}));
  try {
   const response=await fetch('/api/admin/family-friends/convert',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({request_id:q.id,package_id:packageId})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'تعذر التحويل');
   setMessages(v=>({...v,[q.id]:{text:result.already_converted?'تم تحويل الطلب سابقًا: '+result.booking_code:'تم إنشاء الحجز '+result.booking_code+' بنجاح. حالة الدفع: غير مدفوع.',ok:true}}));
  } catch(e) {setMessages(v=>({...v,[q.id]:{text:e instanceof Error?e.message:'تعذر التحويل',ok:false}}));}
  finally{setBusy('');}
 }
 if(!eligible.length)return <div className="rounded-xl border border-forest/10 p-4 text-sm text-forest/60">لا توجد طلبات مؤكدة تحتاج إلى تحويل.</div>;
 return <div className="space-y-3">{eligible.map(q=><article key={q.id} className="rounded-xl border border-forest/10 bg-white p-4">
  <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs font-bold text-[#9b6a10]">{q.reference}</div><h3 className="mt-1 font-semibold text-forest">{q.full_name}</h3><p className="mt-1 text-sm text-forest/65">{q.adults+(q.children_ages||[]).length+(q.infant_ages_months||[]).length} أفراد · السعر المعتمد: {q.quote_amount===null?'غير محدد':Number(q.quote_amount).toLocaleString()+' '+q.quote_currency}</p></div>{q.booking_id?<span className="text-sm font-semibold text-emerald-800">مرتبط بحجز</span>:null}</div>
  {!q.booking_id&&<div className="mt-3 flex flex-wrap gap-2"><select aria-label={'الباقة للطلب '+q.reference} className="min-w-52 rounded-lg border border-forest/20 bg-white px-3 py-2 text-sm" value={selected[q.id]||''} onChange={e=>setSelected(v=>({...v,[q.id]:e.target.value}))}><option value="">اختر الباقة المسجلة في الحجز</option>{packages.map(p=><option key={p.id} value={p.id}>{p.name} · {p.price} {p.currency}</option>)}</select><button type="button" disabled={!!busy} onClick={()=>convert(q)} className="rounded-lg bg-[#063F35] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy===q.id?'جارٍ التحويل…':'إنشاء الحجز وربط الطلب'}</button></div>}
  {messages[q.id]&&<p role="status" className={'mt-3 text-sm '+(messages[q.id].ok?'text-emerald-800':'text-red-700')}>{messages[q.id].text}</p>}
  <p className="mt-2 text-xs text-forest/55">إنشاء الحجز لا يسجّل دفعة ولا يؤكد استلام المال. لن يُضاف تلقائيًا إلى مجموعة مشتركة.</p>
 </article>)}</div>;
}
