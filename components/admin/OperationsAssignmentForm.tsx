"use client";
import{useState}from"react";
const L:Record<string,string>={PENDING:"معلقة",ASSIGNED:"تم التعيين",ACCEPTED:"تم القبول",IN_PROGRESS:"قيد التنفيذ",COMPLETED:"مكتملة",CANCELLED:"ملغاة"};
export function OperationsAssignmentForm({id,currentStatus}:{id:string;currentStatus:string}){
 const[s,setS]=useState(currentStatus||"PENDING"),[b,setB]=useState(false),[reason,setReason]=useState("");
 const ar=typeof document!=="undefined"&&document.cookie.includes("he_locale=ar");
 async function save(){setB(true);const r=await fetch("/api/admin/operations",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status:s,...(s==="CANCELLED"?{cancellation_reason:reason}:{})})});if(r.ok)location.reload();else{setB(false);alert(ar?"تعذر تحديث حالة المهمة.":"Unable to update task status.")}}
 return <div className="flex min-w-44 flex-col gap-2"><div className="flex gap-2"><select value={s} onChange={e=>setS(e.target.value)} className="!py-2 text-xs">{["PENDING","ASSIGNED","ACCEPTED","IN_PROGRESS","COMPLETED","CANCELLED"].map(x=><option key={x} value={x}>{ar?L[x]:x.replaceAll("_"," ")}</option>)}</select><button disabled={b||s==="CANCELLED"&&!reason.trim()} onClick={save} className="btn btn-outline !px-3 !py-2 text-xs">{b?"…":ar?"حفظ":"Save"}</button></div>{s==="CANCELLED"&&<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000} required placeholder={ar?"سبب الإلغاء (مطلوب)":"Cancellation reason (required)"} className="min-w-40 text-xs" rows={2}/>}</div>
}