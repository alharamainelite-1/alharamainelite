"use client";

import { useEffect, useState } from 'react';

const LABELS: Record<string, string> = {
  NEW_REQUEST: 'طلب جديد', CONTACTED: 'تم التواصل', DETAILS_PENDING: 'بانتظار التفاصيل',
  PAYMENT_PENDING: 'بانتظار الدفع', PAYMENT_RECEIVED: 'تم استلام الدفع', CONFIRMED: 'مؤكد',
  PREPARING: 'قيد التجهيز', ACTIVE: 'نشطة', COMPLETED: 'مكتملة', CANCELLED: 'ملغاة',
};
const EDITABLE_STATUSES = ['CONTACTED', 'DETAILS_PENDING', 'PAYMENT_PENDING', 'CANCELLED'];
type BookingStaff={id:string;name:string;role:string};

export function RequestStatusForm({id,status,reference,canHandover=false}:{id:string;status:string;reference?:string;canHandover?:boolean}) {
  const [selected,setSelected]=useState(status);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [bookingStaff,setBookingStaff]=useState<BookingStaff[]>([]);
  const [target,setTarget]=useState('');
  const [handoverNote,setHandoverNote]=useState('');
  const [handoverBusy,setHandoverBusy]=useState(false);
  const [handoverMessage,setHandoverMessage]=useState('');
  const [handedOver,setHandedOver]=useState(false);
  const ar=typeof document!=='undefined'&&document.cookie.includes('he_locale=ar');
  const options=[...new Set([status,...EDITABLE_STATUSES])];

  useEffect(()=>{if(!canHandover||!['DETAILS_PENDING','PAYMENT_PENDING'].includes(status))return;void fetch('/api/admin/staff-tasks',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not load staff');setBookingStaff((j.staff||[]).filter((x:BookingStaff)=>x.role==='BOOKINGS'));}).catch(e=>setHandoverMessage(e instanceof Error?e.message:'Could not load Bookings staff'));},[canHandover,status]);

  async function save() {
    setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/admin/requests',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:selected})});
      const data=await response.json().catch(()=>({}));
      if(response.ok){window.location.reload();return;}
      setMessage(data.error||(ar?'تعذر تحديث الطلب.':'Could not update request.'));
    }catch{setMessage(ar?'تعذر الاتصال. حاول مرة أخرى.':'Network error. Please try again.');}
    finally{setBusy(false);}
  }
  async function handover(){
    setHandoverBusy(true);setHandoverMessage('');
    try{
      const response=await fetch('/api/admin/staff-tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'sales_handover',request_id:id,assigned_staff_id:target,note:handoverNote})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||(ar?'تعذر تسليم الطلب.':'Could not hand over request.'));
      setHandedOver(true);setHandoverMessage(ar?'تم تسليم الطلب إلى موظف الحجوزات وإنشاء مهمة متابعة.':'Request handed to Bookings and a follow-up task was created.');
    }catch(e){setHandoverMessage(e instanceof Error?e.message:'Could not hand over request.');}
    finally{setHandoverBusy(false);}
  }
  return <div className="flex min-w-[220px] flex-col gap-2">
    <div className="flex gap-2">
      <select value={selected} onChange={event=>setSelected(event.target.value)} className="!py-1 text-xs">
        {options.map(value=><option key={value} value={value} disabled={!EDITABLE_STATUSES.includes(value)}>{ar?LABELS[value]||value:value.replaceAll('_',' ')}</option>)}
      </select>
      <button disabled={busy||selected===status} onClick={save} className="btn btn-outline !px-2 !py-1 text-xs">{busy?'…':ar?'حفظ':'Save'}</button>
    </div>
    {message&&<span role="alert" className="text-[11px] text-red-700">{message}</span>}
    {canHandover&&['DETAILS_PENDING','PAYMENT_PENDING'].includes(status)&&<div className="mt-2 grid gap-2 border-t border-forest/10 pt-3">
      <div className="text-xs font-semibold text-forest">{ar?'تسليم إلى الحجوزات':'Handover to Bookings'}{reference?' · '+reference:''}</div>
      {handedOver?<span className="text-xs leading-5 text-emerald-800">{handoverMessage}</span>:<>
        <select required value={target} onChange={e=>setTarget(e.target.value)} className="rounded-lg border border-forest/15 bg-white px-2 py-2 text-xs"><option value="">{ar?'اختر موظف الحجوزات':'Choose Bookings staff'}</option>{bookingStaff.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <textarea required minLength={5} maxLength={1000} rows={2} value={handoverNote} onChange={e=>setHandoverNote(e.target.value)} placeholder={ar?'ما الذي اكتمل وما الخطوة التالية؟':'What is qualified and what should happen next?'} className="rounded-lg border border-forest/15 bg-white px-2 py-2 text-xs"/>
        <button type="button" disabled={handoverBusy||!target||handoverNote.trim().length<5} onClick={handover} className="rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{handoverBusy?(ar?'جارٍ التسليم…':'Handing over…'):(ar?'تأكيد التسليم':'Confirm handover')}</button>
        {handoverMessage&&<span role="alert" className="text-[11px] text-red-700">{handoverMessage}</span>}
      </>}
    </div>}
  </div>;
}
