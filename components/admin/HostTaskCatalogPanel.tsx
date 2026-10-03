'use client';
import {useEffect,useState} from 'react';
type Item={id:string;task_type:string;title:string;description:string|null;amount:number;currency:string;active:boolean};
const TYPES=['AIRPORT_ASSISTANCE','TRAIN_ASSISTANCE','MAKKAH_ZIYARAT','MADINAH_ZIYARAT','JEDDAH_EXPERIENCE','SPECIAL_ASSISTANCE','OTHER'];
export default function HostTaskCatalogPanel(){
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const ar=typeof document!=='undefined'&&document.cookie.includes('he_locale=ar');
 async function load(){setLoading(true);try{const r=await fetch('/api/admin/host-task-catalog',{cache:'no-store'}),j=await r.json();if(!r.ok)throw Error(j.error||'Load failed');setItems(j.items||[])}catch(e){setMsg(e instanceof Error?e.message:'Load failed')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 async function send(method:'POST'|'PATCH',body:Record<string,unknown>){setBusy(true);setMsg('');try{const r=await fetch('/api/admin/host-task-catalog',{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)}),j=await r.json();if(!r.ok)throw Error(j.error||'Save failed');setMsg(ar?'تم حفظ الكتالوج.':'Catalog saved.');await load()}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 if(loading)return <section className="card p-5">{ar?'جارٍ تحميل كتالوج المهام…':'Loading host task catalog…'}</section>;
 return <section className="card p-5"><div className="eyebrow">{ar?'إدارة العمليات':'Operations'}</div><h2 className="serif mt-2 text-3xl text-forest">{ar?'كتالوج مهام المضيفين':'Host Task Price Catalog'}</h2><p className="mt-2 text-sm text-forest/60">{ar?'يُحفظ السعر كنسخة ثابتة عند إسناد المهمة، ولا تتغير المهام السابقة عند تعديل السعر.':'Rates are snapshotted at assignment; editing a catalog price never changes previously assigned tasks.'}</p>
 <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send('POST',{task_type:f.get('task_type'),title:f.get('title'),amount:f.get('amount'),currency:f.get('currency')});e.currentTarget.reset()}}>
 <select name="task_type" required>{TYPES.map(t=><option key={t} value={t}>{t.replaceAll('_',' ')}</option>)}</select><input name="title" required maxLength={120} placeholder={ar?'اسم المهمة':'Task title'}/><input name="amount" type="number" min="0" step="0.01" required placeholder={ar?'السعر':'Rate'}/><select name="currency"><option>USD</option><option>SAR</option></select><button disabled={busy} className="btn btn-primary sm:col-span-2">{ar?'إضافة نوع مهمة':'Add task type'}</button></form>
 {msg&&<p role="status" className="mt-3 text-sm">{msg}</p>}
 <div className="mt-5 grid gap-3">{items.map(i=><form key={i.id} className="grid gap-2 rounded-xl border border-forest/10 p-3 sm:grid-cols-[1fr_1fr_120px_100px_auto]" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send('PATCH',{id:i.id,title:f.get('title'),amount:f.get('amount'),currency:f.get('currency'),active:f.get('active')==='on'})}}>
 <div className="self-center text-xs font-semibold">{i.task_type.replaceAll('_',' ')}</div><input name="title" defaultValue={i.title} aria-label="Task title"/><input name="amount" type="number" min="0" step="0.01" defaultValue={i.amount} aria-label="Rate"/><select name="currency" defaultValue={i.currency}><option>USD</option><option>SAR</option></select><div className="flex items-center gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={i.active}/>{ar?'نشط':'Active'}</label><button disabled={busy} className="btn btn-secondary">{ar?'حفظ':'Save'}</button></div>
 </form>)}</div></section>
}
