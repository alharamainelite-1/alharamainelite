"use client";
import {useState} from "react";
const L:Record<string,string>={PENDING:"معلقة",ASSIGNED:"تم التعيين",ACCEPTED:"تم القبول",IN_PROGRESS:"قيد التنفيذ",COMPLETED:"مكتملة",CANCELLED:"ملغاة"};
export function OperationsAssignmentForm({id,currentStatus}:{id:string;currentStatus:string}){
 const [s,setS]=useState(currentStatus||"PENDING"),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const ar=typeof document!=="undefined"&&document.cookie.includes("he_locale=ar");
 async function save(){
  setError("");
  if(s==="CANCELLED"&&reason.trim().length<3){setError(ar?"يرجى كتابة سبب الإلغاء (3 أحرف على الأقل).":"Enter a cancellation reason (at least 3 characters).");return;}
  setBusy(true);
  try{
   const r=await fetch("/api/admin/operations",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status:s,...(s==="CANCELLED"?{cancellation_reason:reason.trim()}: {})})});
   const data=await r.json().catch(()=>({}));
   if(!r.ok){setError(data.error||(ar?"تعذر حفظ التغيير.":"Could not save changes."));setBusy(false);return;}
   location.reload();
  }catch{setError(ar?"تعذر الاتصال. حاول مجددًا.":"Network error. Please try again.");setBusy(false);}
 }
 return <div className="flex min-w-40 flex-col gap-2">
  <select value={s} onChange={e=>setS(e.target.value)} className="!py-2 text-xs" disabled={busy}>{["PENDING","ASSIGNED","ACCEPTED","IN_PROGRESS","COMPLETED","CANCELLED"].map(x=><option key={x} value={x}>{ar?L[x]:x.replaceAll("_"," ")}</option>)}</select>
  {s==="CANCELLED"&&currentStatus!=="CANCELLED"&&<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000} required placeholder={ar?"سبب الإلغاء مطلوب":"Cancellation reason required"} className="w-full rounded border p-2 text-xs" rows={2} disabled={busy}/>}
  {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  <button disabled={busy||s===currentStatus} onClick={save} className="btn btn-outline !px-3 !py-2 text-xs">{busy?"…":ar?"حفظ":"Save"}</button>
 </div>
}