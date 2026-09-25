'use client';
import {useEffect,useState} from 'react';
import {adminText} from '@/lib/admin-text';

type Role='SUPER_ADMIN'|'ADMIN'|'OPERATIONS_MANAGER'|'OPERATIONS'|'SALES'|'FINANCE'|'HOST';
type User={id:string;email:string;full_name:string;phone:string;role:Role;created_at:string;email_confirmed:boolean;banned:boolean};
const roles:Role[]=['ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE','HOST'];
const descriptions:Record<Role,{en:string;ar:string}>={
 SUPER_ADMIN:{en:'Full control, staff accounts, permissions, settings, finance and all operations.',ar:'صلاحية كاملة تشمل الموظفين والصلاحيات والإعدادات والمالية والعمليات.'},
 ADMIN:{en:'Business administration, operations, bookings, finance and settings. Cannot manage staff accounts.',ar:'إدارة الأعمال والعمليات والحجوزات والمالية والإعدادات دون إدارة حسابات الموظفين.'},
 OPERATIONS_MANAGER:{en:'Owns journey readiness, groups, hotels, transport, train, hosts and operational tasks.',ar:'مسؤول عن جاهزية الرحلات والمجموعات والفنادق والنقل والقطار والمضيفين والمهام التشغيلية.'},
 OPERATIONS:{en:'Works on assigned operational tasks, resources and journey readiness.',ar:'تنفيذ المهام التشغيلية والموارد وجاهزية الرحلات.'},
 SALES:{en:'Owns requests, customer follow-up, bookings, communications and payment handover.',ar:'إدارة الطلبات ومتابعة العملاء والحجوزات والتواصل وتسليم المدفوعات للمالية.'},
 FINANCE:{en:'Owns payment verification, expenses and financial reporting.',ar:'مسؤول عن التحقق من المدفوعات والمصروفات والتقارير المالية.'},
 HOST:{en:'Host-facing access for assigned journey tasks when host accounts are enabled.',ar:'صلاحية المضيف للمهام المخصصة له عند تفعيل حسابات المضيفين.'}
};
export default function TeamManager(){
 const [users,setUsers]=useState<User[]>([]);const[loading,setLoading]=useState(true);const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');
 const[form,setForm]=useState<{full_name:string;email:string;phone:string;role:Role}>({full_name:'',email:'',phone:'',role:'SALES'});
 const roleLabels:Record<Role,string>={SUPER_ADMIN:'المدير العام',ADMIN:'مدير الإدارة',OPERATIONS_MANAGER:'مدير العمليات',OPERATIONS:'موظف العمليات',SALES:'المبيعات',FINANCE:'المالية',HOST:'المضيف'};
 const[locale,setLocale]=useState<'en'|'ar'>('ar');const t=adminText[locale];
 useEffect(()=>{const m=document.cookie.match(/(?:^|; )he_locale=([^;]+)/);if(m?.[1]==='ar')setLocale('ar');},[]);
 async function load(){setLoading(true);const r=await fetch('/api/admin/team');const j=await r.json();if(r.ok)setUsers(j.users||[]);else setMessage(j.error||'Unable to load team.');setLoading(false)}
 useEffect(()=>{load()},[]);
 async function create(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');const r=await fetch('/api/admin/team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const j=await r.json();setMessage(r.ok?t.invitationSent:j.error||'Unable to create account.');if(r.ok){setForm({full_name:'',email:'',phone:'',role:'SALES'});await load()}setBusy(false)}
 async function update(userId:string,body:object){setBusy(true);setMessage('');const r=await fetch('/api/admin/team',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,...body})});const j=await r.json();setMessage(r.ok?t.accessUpdated:j.error||'Unable to update access.');if(r.ok)await load();setBusy(false)}
 return <div className="grid gap-8">
  <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
   <div className="card p-6"><div className="eyebrow">{t.createStaff}</div><h2 className="serif mt-2 text-3xl text-forest">{t.invite}</h2><p className="mt-2 text-sm leading-6 text-forest/55">{t.inviteDesc}</p>
    <form onSubmit={create} className="mt-6 grid gap-4">
     <input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder={t.fullName} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder={t.workEmail} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder={t.phone} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <select value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none">{roles.map(r=><option key={r} value={r}>{locale==='ar'?roleLabels[r]:r.replaceAll('_',' ')}</option>)}</select>
     <button disabled={busy} className="btn btn-primary">{busy?t.working:t.sendInvitation}</button>
    </form>
   </div>
   <div className="card p-6"><div className="eyebrow">{t.permissionModel}</div><h2 className="serif mt-2 text-3xl text-forest">{t.roleAccess}</h2><div className="mt-5 grid gap-3">{(['SUPER_ADMIN',...roles] as Role[]).map(r=><div key={r} className="rounded-xl bg-[#f7f3ea] p-4"><div className="font-semibold text-forest">{locale==='ar'?roleLabels[r]:r.replaceAll('_',' ')}</div><div className="mt-1 text-xs leading-5 text-forest/55">{descriptions[r][locale]}</div></div>)}</div></div>
  </div>
  {message&&<div className="rounded-xl border border-gold/30 bg-[#fffaf0] p-4 text-sm text-forest">{message}</div>}
  <div className="card overflow-x-auto"><div className="border-b border-forest/10 p-6"><div className="eyebrow">{locale==='ar'?'الفريق':'Team'}</div><h2 className="serif mt-2 text-3xl text-forest">{t.teamAccounts}</h2></div>
   {loading?<div className="p-10 text-center text-forest/45">{locale==='ar'?'جارٍ تحميل الفريق…':'Loading team…'}</div>:<table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#faf8f2]"><tr>{[t.employee,t.role,t.account,t.joined,t.access].map(h=><th key={h} className="px-5 py-4 font-semibold text-forest">{h}</th>)}</tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-t border-forest/8"><td className="px-5 py-5"><div className="font-semibold text-forest">{u.full_name||'—'}</div><div className="text-xs text-forest/45">{u.email}</div>{u.phone&&<div className="text-xs text-forest/45">{u.phone}</div>}</td><td className="px-5 py-5"><select value={u.role} disabled={busy} onChange={e=>update(u.id,{action:'role',role:e.target.value})} className="rounded-lg border border-forest/10 bg-white px-3 py-2 text-xs">{['SUPER_ADMIN',...roles].map(r=><option key={r} value={r}>{locale==='ar'?roleLabels[r as Role]:r}</option>)}</select></td><td className="px-5 py-5"><span className={'rounded-full px-3 py-1 text-xs font-semibold '+(u.email_confirmed?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800')}>{u.email_confirmed?t.activeEmail:t.invitationPending}</span></td><td className="px-5 py-5 text-xs text-forest/45">{new Date(u.created_at).toLocaleDateString(locale==='ar'?'ar-SA':'en-GB')}</td><td className="px-5 py-5"><button disabled={busy} onClick={()=>update(u.id,{action:'active',active:u.banned})} className="text-xs font-semibold text-forest underline">{u.banned?t.reactivate:t.deactivate}</button></td></tr>)}</tbody></table>}
  </div>
 </div>
}