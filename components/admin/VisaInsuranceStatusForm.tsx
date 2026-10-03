'use client';
import {useState} from 'react';
type Row={id:string;visa_status:string;insurance_status:string;internal_notes:string|null};
const visaOptions=[['NOT_STARTED','Not started'],['DOCUMENTS_PENDING','Customer details pending'],['SUBMITTED','Application submitted'],['UNDER_REVIEW','Under processing'],['ISSUED','Issued'],['REJECTED','Unable to issue'],['NOT_REQUIRED','Not required']];
const insuranceOptions=[['NOT_STARTED','Not started'],['PENDING','In progress'],['ISSUED','Issued'],['NOT_REQUIRED','Not required']];
export function VisaInsuranceStatusForm({bookingId,initial}:{bookingId:string;initial:Row|null}){
 const [form,setForm]=useState<Row>(initial||{id:'',visa_status:'NOT_STARTED',insurance_status:'NOT_STARTED',internal_notes:''});
 const [saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const change=(key:keyof Row,value:string)=>setForm(old=>({...old,[key]:value}));
 async function save(){setSaving(true);setMessage('');try{const r=await fetch('/api/admin/visa-insurance',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({booking_id:bookingId,visa_status:form.visa_status,insurance_status:form.insurance_status,internal_notes:form.internal_notes||''})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to save');setForm({...form,...j.travel});setMessage('Saved successfully');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save');}finally{setSaving(false)}}
 return <div className="mt-4 grid gap-3 rounded-xl border border-forest/10 bg-[#faf8f2] p-4">
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="grid gap-1 text-xs font-semibold text-forest">Saudi visa status<select className="rounded-lg border border-forest/15 bg-white p-2 text-sm font-normal" value={form.visa_status} onChange={e=>change('visa_status',e.target.value)}>{visaOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label className="grid gap-1 text-xs font-semibold text-forest">Health insurance status<select className="rounded-lg border border-forest/15 bg-white p-2 text-sm font-normal" value={form.insurance_status} onChange={e=>change('insurance_status',e.target.value)}>{insuranceOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
  </div>
  <label className="grid gap-1 text-xs font-semibold text-forest">Internal notes<textarea maxLength={2000} rows={2} className="rounded-lg border border-forest/15 bg-white p-2 text-sm font-normal" value={form.internal_notes||''} onChange={e=>change('internal_notes',e.target.value)} placeholder="Optional booking-level note, e.g. awaiting one guest's visa"/></label>
  <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-xs text-forest/60">{message}</p><button type="button" disabled={saving} onClick={save} className="btn btn-primary px-5 py-2 text-sm disabled:opacity-50">{saving?'Saving…':'Save status'}</button></div>
 </div>
}