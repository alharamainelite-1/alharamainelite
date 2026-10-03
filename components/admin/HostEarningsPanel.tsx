'use client';
import { useEffect, useState } from 'react';

type Earning = {
  id: string; host_task_id: string; host_id: string; amount: number; currency: string;
  status: string; payment_reference: string | null; hosts?: { name?: string } | null;
  host_tasks?: { task_id?: string; task_type?: string; date?: string; start_time?: string | null; end_time?: string | null } | null;
};
export default function HostEarningsPanel({ role }: { role: string }) {
  const [items,setItems] = useState<Earning[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState('');
  const [message,setMessage] = useState('');
  const [refs,setRefs] = useState<Record<string,string>>({});
  const ar = typeof document !== 'undefined' && document.cookie.includes('he_locale=ar');
  async function load() {
    setLoading(true);
    try { const r=await fetch('/api/admin/host-earnings',{cache:'no-store'}); const j=await r.json(); if(!r.ok) throw new Error(j.error||'Could not load earnings.'); setItems(j.earnings||[]); }
    catch(e) { setMessage(e instanceof Error?e.message:'Could not load earnings.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load()},[]);
  async function change(item:Earning,status:'APPROVED'|'REJECTED'|'PAID') {
    setBusy(item.id);setMessage('');
    try {
      const r=await fetch('/api/admin/host-earnings',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:item.id,status,payment_reference:refs[item.id]||''})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||'Update failed.');
      setMessage(ar?'تم تحديث المستحق بنجاح.':'Earning updated successfully.'); await load();
    } catch(e) {setMessage(e instanceof Error?e.message:'Update failed.');}
    finally {setBusy('');}
  }
  if(loading)return <section className="card p-5"><p>{ar?'جارٍ تحميل مستحقات المضيفين…':'Loading host earnings…'}</p></section>;
  return <section className="card p-5">
    <div className="eyebrow">{ar?'مستحقات المضيفين':'Host Compensation'}</div>
    <h2 className="serif mt-2 text-3xl text-forest">{ar?'مراجعة المستحقات والمدفوعات':'Earnings Review & Payments'}</h2>
    <p className="mt-2 text-sm text-forest/60">{ar?'هذا القسم متاح للمالية والمدير العام فقط.':'Restricted to Finance and Super Admin. Hosts cannot access this information.'}</p>
    {message&&<p role="status" className="mt-3 rounded-lg bg-[#f7f3ea] p-3 text-sm">{message}</p>}
    {items.length===0?<p className="mt-5 text-sm text-forest/55">{ar?'لا توجد مستحقات مسجلة.':'No host earnings recorded yet.'}</p>:<div className="mt-5 grid gap-3">{items.map(x=><article key={x.id} className="rounded-xl border border-forest/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold text-forest">{x.hosts?.name||x.host_id}</div><div className="mt-1 text-xs text-forest/55">{x.host_tasks?.task_id||x.host_task_id} · {String(x.host_tasks?.task_type||'Task').replaceAll('_',' ')} · {x.host_tasks?.date||'—'} {x.host_tasks?.start_time||''}</div></div><div className="text-right"><div className="font-semibold tabular-nums">{x.currency} {Number(x.amount).toLocaleString(undefined,{maximumFractionDigits:2})}</div><div className="mt-1 text-xs">{x.status.replaceAll('_',' ')}</div></div></div>
      {x.status==='PENDING_REVIEW'&&<div className="mt-4 flex flex-wrap gap-2"><button disabled={busy===x.id} onClick={()=>void change(x,'APPROVED')} className="btn btn-primary">{ar?'اعتماد':'Approve'}</button><button disabled={busy===x.id} onClick={()=>void change(x,'REJECTED')} className="btn btn-secondary">{ar?'رفض':'Reject'}</button></div>}
      {x.status==='APPROVED'&&<div className="mt-4 flex flex-wrap gap-2"><input value={refs[x.id]||''} onChange={e=>setRefs(p=>({...p,[x.id]:e.target.value}))} placeholder={ar?'مرجع التحويل البنكي':'Bank transfer reference'} className="min-w-0 flex-1"/><button disabled={busy===x.id||!String(refs[x.id]||'').trim()} onClick={()=>void change(x,'PAID')} className="btn btn-primary">{ar?'تسجيل الدفع':'Record payment'}</button></div>}
      {x.status==='PAID'&&<p className="mt-3 text-xs text-forest/55">{ar?'مرجع الدفع: ':'Payment reference: '}{x.payment_reference||'—'}</p>}
    </article>)}</div>}
    <div className="mt-4"><button onClick={()=>void load()} className="text-sm underline">{ar?'تحديث القائمة':'Refresh list'}</button></div>
  </section>;
}
