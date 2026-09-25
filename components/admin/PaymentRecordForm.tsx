'use client';
import {useState} from 'react';
export function PaymentRecordForm({bookings}:{bookings:any[]}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget);const r=await fetch('/api/admin/payments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({booking_id:f.get('booking_id'),amount:f.get('amount'),currency:f.get('currency'),date:f.get('date'),method:f.get('method'),reference:f.get('reference'),notes:f.get('notes')})});const j=await r.json();setMessage(r.ok?'Payment recorded and awaiting verification.':j.error||'Could not record payment.');setBusy(false);if(r.ok)location.reload()}
 return <form onSubmit={submit} className="card mt-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
  <select name="booking_id" required><option value="">Select booking</option>{bookings.map(b=><option key={b.id} value={b.id}>{b.booking_id} · {b.currency} {Number(b.total_amount).toLocaleString()}</option>)}</select>
  <input name="amount" required type="number" min="0.01" step="0.01" placeholder="Received amount"/>
  <select name="currency"><option>USD</option><option>SAR</option></select><input name="date" required type="date" defaultValue={new Date().toISOString().slice(0,10)}/>
  <select name="method"><option>BANK_TRANSFER</option><option>CASH</option><option>OTHER</option></select><input name="reference" placeholder="Bank / transfer reference"/><input name="notes" placeholder="Notes" className="sm:col-span-2"/><button disabled={busy} className="btn btn-primary">{busy?'Saving…':'Record payment'}</button>{message&&<span className="text-sm text-forest/60 sm:col-span-3">{message}</span>}
 </form>
}