'use client';
import { useState } from 'react';

const STATUS = ['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','HANDED_TO_OPERATIONS','OPERATIONS_IN_PROGRESS','PREPARING','JOURNEY_READY','ACTIVE','COMPLETED','CANCELLED'] as const;

export function BookingStatusForm({ bookingId, currentStatus, paymentStatus }: { bookingId:string; currentStatus:string; paymentStatus:string }) {
  const [status,setStatus]=useState(currentStatus);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function save(){
    setBusy(true); setMessage('');
    const res=await fetch('/api/admin/bookings',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({bookingId,status})});
    const data=await res.json().catch(()=>({}));
    setMessage(res.ok ? 'Saved.' : (data.error || 'Could not save.'));
    if(res.ok) window.location.reload();
    setBusy(false);
  }
  const canConfirm = paymentStatus === 'RECEIVED';
  return <div className="flex min-w-[270px] items-center gap-2">
    <select value={status} onChange={e=>setStatus(e.target.value)} className="!py-2 text-xs">
      {STATUS.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}
    </select>
    <button type="button" disabled={busy || (status==='CONFIRMED' && !canConfirm)} onClick={save} className="btn btn-outline !px-3 !py-2 text-xs">{busy?'Saving…':'Save'}</button>
    {message && <span className="text-[11px] text-forest/60">{message}</span>}
  </div>;
}
