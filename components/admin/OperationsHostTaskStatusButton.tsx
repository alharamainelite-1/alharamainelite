'use client';
import {useState} from 'react';
export function OperationsHostTaskStatusButton({id,source,nextStatus,label}:{id:string;source:'host_tasks'|'operations_tasks';nextStatus:string;label:string}){
 const [loading,setLoading]=useState(false);
 async function update(){setLoading(true);try{const res=await fetch('/api/admin/host-tasks',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:nextStatus,source_table:source})});if(!res.ok){const b=await res.json().catch(()=>null);throw new Error(b?.error||'Unable to update task.')}window.location.reload();}catch(e){alert(e instanceof Error?e.message:'Unable to update task.');setLoading(false)}}
 return <button type="button" onClick={update} disabled={loading} className="btn btn-primary">{loading?'Saving…':label}</button>;
}