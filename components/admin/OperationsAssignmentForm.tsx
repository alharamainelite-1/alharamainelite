"use client";
import {useState} from "react";

const L:Record<string,string>={PENDING:"معلقة",ASSIGNED:"تم التعيين",ACCEPTED:"تم القبول",IN_PROGRESS:"قيد التنفيذ",COMPLETED:"مكتملة",CANCELLED:"ملغاة"};

export function OperationsAssignmentForm({id,currentStatus,cancellationReason,cancelledAt}:{id:string;currentStatus:string;cancellationReason?:string|null;cancelledAt?:string|null}){
  const [s,setS]=useState(currentStatus||"PENDING");
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const ar=typeof document!=="undefined"&&document.cookie.includes("he_locale=ar");
  async function save(){
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/admin/operations",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status:s,...(s==="CANCELLED"?{cancellation_reason:reason}:{})})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||(ar?"تعذر حفظ التغيير":"Could not save changes."));
      location.reload();
    }catch(e){setError(e instanceof Error?e.message:(ar?"تعذر حفظ التغيير":"Could not save changes."));setBusy(false);}
  }
  const isCancelled=currentStatus==="CANCELLED";
  return <div className="flex min-w-44 flex-col gap-2">
    <select aria-label={ar?"حالة المهمة":"Task status"} value={s} disabled={busy||isCancelled} onChange={e=>setS(e.target.value)} className="!py-2 text-xs">
      {["PENDING","ASSIGNED","ACCEPTED","IN_PROGRESS","COMPLETED","CANCELLED"].map(x=><option key={x} value={x}>{ar?L[x]:x.replaceAll("_"," ")}</option>)}
    </select>
    {s==="CANCELLED"&&!isCancelled&&<textarea aria-label={ar?"سبب الإلغاء":"Cancellation reason"} required minLength={5} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder={ar?"اكتب سبب الإلغاء (مطلوب)":"Enter cancellation reason (required)"} className="min-h-20 rounded-lg border border-forest/15 p-2 text-xs" />}
    {s!==currentStatus&&!isCancelled&&<button disabled={busy||(s==="CANCELLED"&&reason.trim().length<5)} onClick={save} className="btn btn-outline !px-3 !py-2 text-xs">{busy?"…":ar?"حفظ":"Save"}</button>}
    {error&&<span role="alert" className="text-xs text-red-700">{error}</span>}
    {currentStatus==="CANCELLED"&&<div className="rounded-lg bg-[#f7f3ea] p-2 text-xs text-forest/70"><p>{ar?"سبب الإلغاء:":"Cancellation reason:"} {cancellationReason||"—"}</p>{cancelledAt&&<p className="mt-1">{ar?"وقت الإلغاء:":"Cancelled at:"} {new Date(cancelledAt).toLocaleString(ar?"ar-SA":"en-GB")}</p>}<p className="mt-1">{ar?"لا يمكن إعادة فتح المهمة الملغاة.":"Cancelled tasks cannot be reopened."}</p></div>}
  </div>;
}
