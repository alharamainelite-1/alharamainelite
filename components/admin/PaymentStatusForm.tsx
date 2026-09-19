'use client';
import { useState } from 'react';

const STATUS = ['PAYMENT_INSTRUCTIONS_SENT','PENDING_VERIFICATION','RECEIVED','PARTIALLY_RECEIVED','REFUNDED','FAILED'] as const;

export function PaymentStatusForm({ paymentId, currentStatus }: { paymentId:string; currentStatus:string }) {
  const [status,setStatus]=useState(currentStatus);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function save(){
    setBusy(true); setMessage('');
    const res=await fetch('/api/admin/payments',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({paymentId,status})});
    const data=await res.json().catch(()=>({}));
    setMessage(res.ok ? 'Saved.' : (data.error || 'Could not save.'));
    if(res.ok) window.location.reload();
    setBusy(false);
  }
  return <div className="flex min-w-[260px] items-center gap-2">
    <select value={status} onChange={e=>setStatus(e.target.value)} className="!py-2 text-xs">
      {STATUS.map(s=><option key={s} value={s}>{s}</option>)}
      {currentStatus==='NOT_REQUESTED' && <option value="NOT_REQUESTED">NOT_REQUESTED</option>}
    </select>
    <button type="button" disabled={busy} onClick={save} className="btn btn-outline !px-3 !py-2 text-xs">{busy?'Saving…':'Save'}</button>
    {message && <span className="text-[11px] text-forest/60">{message}</span>}
  </div>;
}
