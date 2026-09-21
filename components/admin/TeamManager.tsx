'use client';
import {useEffect,useState} from 'react';

type Role='SUPER_ADMIN'|'ADMIN'|'OPERATIONS_MANAGER'|'OPERATIONS'|'SALES'|'FINANCE'|'HOST';
type User={id:string;email:string;full_name:string;phone:string;role:Role;created_at:string;email_confirmed:boolean;banned:boolean};
const roles:Role[]=['ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE','HOST'];
const descriptions:Record<Role,string>={
 SUPER_ADMIN:'Full control, staff accounts, permissions, settings, finance and all operations.',
 ADMIN:'Business administration, operations, bookings, finance and settings. Cannot manage staff accounts.',
 OPERATIONS_MANAGER:'Owns journey readiness, groups, hotels, transport, train, hosts and operational tasks.',
 OPERATIONS:'Works on assigned operational tasks, resources and journey readiness.',
 SALES:'Owns requests, customer follow-up, bookings, communications and payment handover.',
 FINANCE:'Owns payment verification, expenses and financial reporting.',
 HOST:'Host-facing access for assigned journey tasks when host accounts are enabled.'
};
export default function TeamManager(){
 const [users,setUsers]=useState<User[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
 const [form,setForm]=useState({full_name:'',email:'',phone:'',role:'SALES' as Role});
 async function load(){setLoading(true);const r=await fetch('/api/admin/team');const j=await r.json();if(r.ok)setUsers(j.users||[]);else setMessage(j.error||'Unable to load team.');setLoading(false)}
 useEffect(()=>{load()},[]);
 async function create(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');const r=await fetch('/api/admin/team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const j=await r.json();setMessage(r.ok?'Invitation sent. The employee will set their password from the email link.':j.error||'Unable to create account.');if(r.ok){setForm({full_name:'',email:'',phone:'',role:'SALES'});load()}setBusy(false)}
 async function update(userId:string,body:object){setBusy(true);setMessage('');const r=await fetch('/api/admin/team',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,...body})});const j=await r.json();setMessage(r.ok?'Access updated.':j.error||'Unable to update access.');if(r.ok)load();setBusy(false)}
 return <div className="grid gap-8">
  <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
   <div className="card p-6"><div className="eyebrow">Create staff account</div><h2 className="serif mt-2 text-3xl text-forest">Invite a team member</h2><p className="mt-2 text-sm leading-6 text-forest/55">The employee receives an invitation by email, then creates their own password. You never need to share a password.</p>
    <form onSubmit={create} className="mt-6 grid gap-4">
     <input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Full name" className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Work email" className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="WhatsApp / phone" className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <select value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none">{roles.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</select>
     <button disabled={busy} className="btn btn-primary">{busy?'Working…':'Send invitation'}</button>
    </form>
   </div>
   <div className="card p-6"><div className="eyebrow">Permission model</div><h2 className="serif mt-2 text-3xl text-forest">Role-based access</h2><div className="mt-5 grid gap-3">{roles.map(r=><div key={r} className="rounded-xl bg-[#f7f3ea] p-4"><div className="font-semibold text-forest">{r.replaceAll('_',' ')}</div><div className="mt-1 text-xs leading-5 text-forest/55">{descriptions[r]}</div></div>)}</div></div>
  </div>
  {message&&<div className="rounded-xl border border-gold/30 bg-[#fffaf0] p-4 text-sm text-forest">{message}</div>}
  <div className="card overflow-x-auto"><div className="border-b border-forest/10 p-6"><div className="eyebrow">Team</div><h2 className="serif mt-2 text-3xl text-forest">Staff accounts</h2></div>
   {loading?<div className="p-10 text-center text-forest/45">Loading team…</div>:<table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#faf8f2]"><tr>{['Employee','Role','Account','Joined','Access'].map(h=><th key={h} className="px-5 py-4 font-semibold text-forest">{h}</th>)}</tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-t border-forest/8"><td className="px-5 py-5"><div className="font-semibold text-forest">{u.full_name||'—'}</div><div className="text-xs text-forest/45">{u.email}</div>{u.phone&&<div className="text-xs text-forest/45">{u.phone}</div>}</td><td className="px-5 py-5"><select value={u.role} disabled={busy} onChange={e=>update(u.id,{action:'role',role:e.target.value})} className="rounded-lg border border-forest/10 bg-white px-3 py-2 text-xs">{['SUPER_ADMIN',...roles].map(r=><option key={r}>{r}</option>)}</select></td><td className="px-5 py-5"><span className={'rounded-full px-3 py-1 text-xs font-semibold '+(u.email_confirmed?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800')}>{u.email_confirmed?'Active email':'Invitation pending'}</span></td><td className="px-5 py-5 text-xs text-forest/45">{new Date(u.created_at).toLocaleDateString('en-GB')}</td><td className="px-5 py-5"><button disabled={busy} onClick={()=>update(u.id,{action:'active',active:u.banned})} className="text-xs font-semibold text-forest underline">{u.banned?'Reactivate account':'Deactivate account'}</button></td></tr>)}</tbody></table>}
  </div>
 </div>
}