"use client";
import{useState}from"react";
export function OperationsResourceForm({id,hostId,vehicleId,staffId,hosts,vehicles,staff}:{id:string;hostId:string|null;vehicleId:string|null;staffId:string|null;hosts:{id:string;name:string}[];vehicles:{id:string;vehicle_id:string}[];staff:{id:string;name:string}[]}){
 const[h,setH]=useState(hostId||""),[v,setV]=useState(vehicleId||""),[u,setU]=useState(staffId||""),[b,setB]=useState(false);
 async function save(){setB(true);const r=await fetch("/api/admin/operations/resources",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,assigned_host:h||null,assigned_vehicle:v||null,assigned_staff_id:u||null})});if(r.ok)location.reload();else setB(false)}
 return <div className="grid gap-1">
  <select value={u} onChange={e=>setU(e.target.value)} className="!py-1 text-xs"><option value="">No staff</option>{staff.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={h} onChange={e=>setH(e.target.value)} className="!py-1 text-xs"><option value="">No host</option>{hosts.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={v} onChange={e=>setV(e.target.value)} className="!py-1 text-xs"><option value="">No vehicle</option>{vehicles.map(x=><option key={x.id} value={x.id}>{x.vehicle_id}</option>)}</select>
  <button disabled={b} onClick={save} className="btn btn-outline !px-2 !py-1 text-xs">{b?"Saving…":"Assign"}</button>
 </div>
}