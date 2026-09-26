'use client';
import {useEffect,useState} from 'react';
import {adminText} from '@/lib/admin-text';

type Role='SUPER_ADMIN'|'ADMIN'|'OPERATIONS_MANAGER'|'OPERATIONS'|'SALES'|'FINANCE'|'HOST';
type User={id:string;email:string;full_name:string;phone:string;role:Role;created_at:string;email_confirmed:boolean;banned:boolean};
const roles:Role[]=['ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE','HOST'];
const roleLabels:Record<Role,string>={SUPER_ADMIN:'المدير العام',ADMIN:'مدير الإدارة',OPERATIONS_MANAGER:'مدير العمليات',OPERATIONS:'موظف العمليات',SALES:'المبيعات',FINANCE:'المالية',HOST:'المضيف'};
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
 const [users,setUsers]=useState<User[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [locale,setLocale]=useState<'en'|'ar'>('ar');
 const [selected,setSelected]=useState<User|null>(null);
 const [edit,setEdit]=useState({full_name:'',email:'',phone:'',role:'SALES' as Role});
 const [form,setForm]=useState({full_name:'',email:'',phone:'',role:'SALES' as Role});
 const t=adminText[locale];

 useEffect(()=>{const m=document.cookie.match(/(?:^|; )he_locale=([^;]+)/);if(m&&m[1]==='en')setLocale('en');},[]);
 async function load(){
  setLoading(true);
  const r=await fetch('/api/admin/team',{cache:'no-store'});
  const j=await r.json();
  if(r.ok)setUsers(j.users||[]);else setMessage(j.error||'Unable to load team.');
  setLoading(false);
 }
 useEffect(()=>{load();},[]);

 async function create(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage('');
  const r=await fetch('/api/admin/team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
  const j=await r.json();
  setMessage(r.ok?t.invitationSent:j.error||'Unable to create account.');
  if(r.ok){setForm({full_name:'',email:'',phone:'',role:'SALES'});await load();}
  setBusy(false);
 }
 async function update(userId:string,body:Record<string,unknown>){
  setBusy(true);setMessage('');
  const r=await fetch('/api/admin/team',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({userId},body))});
  const j=await r.json();
  if(r.ok){setMessage(locale==='ar'?'تم تحديث الحساب بنجاح.':'Account updated successfully.');await load();}
  else setMessage(j.error||'Unable to update account.');
  setBusy(false);
 }
 function openProfile(u:User){
  setSelected(u);
  setEdit({full_name:u.full_name,email:u.email,phone:u.phone||'',role:u.role});
  setMessage('');
 }
 function closeProfile(){if(!busy)setSelected(null);}

 return <div className="grid gap-8">
  <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
   <div className="card p-6">
    <div className="eyebrow">{t.createStaff}</div>
    <h2 className="serif mt-2 text-3xl text-forest">{t.invite}</h2>
    <p className="mt-2 text-sm leading-6 text-forest/55">{t.inviteDesc}</p>
    <form onSubmit={create} className="mt-6 grid gap-4">
     <input required value={form.full_name} onChange={e=>setForm(Object.assign({},form,{full_name:e.target.value}))} placeholder={t.fullName} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <input required type="email" value={form.email} onChange={e=>setForm(Object.assign({},form,{email:e.target.value}))} placeholder={t.workEmail} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <input value={form.phone} onChange={e=>setForm(Object.assign({},form,{phone:e.target.value}))} placeholder={t.phone} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none"/>
     <select value={form.role} onChange={e=>setForm(Object.assign({},form,{role:e.target.value as Role}))} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none">
      {roles.map(r=><option key={r} value={r}>{locale==='ar'?roleLabels[r]:r.replaceAll('_',' ')}</option>)}
     </select>
     <button disabled={busy} className="btn btn-primary">{busy?t.working:t.sendInvitation}</button>
    </form>
   </div>
   <div className="card p-6">
    <div className="eyebrow">{t.permissionModel}</div>
    <h2 className="serif mt-2 text-3xl text-forest">{t.roleAccess}</h2>
    <div className="mt-5 grid gap-3">{(['SUPER_ADMIN'].concat(roles) as Role[]).map(r=><div key={r} className="rounded-xl bg-[#f7f3ea] p-4"><div className="font-semibold text-forest">{locale==='ar'?roleLabels[r]:r.replaceAll('_',' ')}</div><div className="mt-1 text-xs leading-5 text-forest/55">{descriptions[r][locale]}</div></div>)}</div>
   </div>
  </div>

  {message&&<div className="rounded-xl border border-gold/30 bg-[#fffaf0] p-4 text-sm text-forest">{message}</div>}

  <div className="card overflow-x-auto">
   <div className="border-b border-forest/10 p-6"><div className="eyebrow">{locale==='ar'?'الفريق':'Team'}</div><h2 className="serif mt-2 text-3xl text-forest">{t.teamAccounts}</h2></div>
   {loading?<div className="p-10 text-center text-forest/45">{locale==='ar'?'جارٍ تحميل الفريق…':'Loading team…'}</div>:
   <table className="w-full min-w-[900px] text-left text-sm">
    <thead className="bg-[#faf8f2]"><tr>{[t.employee,t.role,t.account,t.joined,locale==='ar'?'إدارة الحساب':'Account'].map(h=><th key={h} className="px-5 py-4 font-semibold text-forest">{h}</th>)}</tr></thead>
    <tbody>{users.map(u=><tr key={u.id} className="border-t border-forest/8">
     <td className="px-5 py-5"><div className="font-semibold text-forest">{u.full_name||'—'}</div><div className="text-xs text-forest/45">{u.email}</div>{u.phone&&<div className="text-xs text-forest/45">{u.phone}</div>}</td>
     <td className="px-5 py-5"><span className="rounded-full bg-[#f7f3ea] px-3 py-2 text-xs font-semibold text-forest">{locale==='ar'?roleLabels[u.role]:u.role.replaceAll('_',' ')}</span></td>
     <td className="px-5 py-5"><span className={'rounded-full px-3 py-1 text-xs font-semibold '+(u.email_confirmed?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800')}>{u.email_confirmed?t.activeEmail:t.invitationPending}</span></td>
     <td className="px-5 py-5 text-xs text-forest/45">{new Date(u.created_at).toLocaleDateString(locale==='ar'?'ar-SA':'en-GB')}</td>
     <td className="px-5 py-5"><button type="button" disabled={busy} onClick={()=>openProfile(u)} className="inline-flex cursor-pointer items-center rounded-xl border border-forest/15 bg-white px-4 py-2 text-xs font-semibold text-forest shadow-sm hover:border-gold hover:bg-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-50">{locale==='ar'?'عرض الملف':'View profile'}</button></td>
    </tr>)}</tbody>
   </table>}
  </div>

  {selected&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
   <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" dir={locale==='ar'?'rtl':'ltr'}>
    <div className="flex items-start justify-between gap-4 border-b border-forest/10 pb-5">
     <div><div className="eyebrow">{locale==='ar'?'ملف عضو الفريق':'Team member profile'}</div><h3 className="serif mt-2 text-3xl text-forest">{locale==='ar'?'بيانات الموظف':'Staff details'}</h3></div>
     <button type="button" onClick={closeProfile} className="rounded-lg px-3 py-1 text-2xl text-forest/45 hover:bg-[#f7f3ea]" aria-label="Close">×</button>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
     <label className="text-sm font-semibold text-forest">{locale==='ar'?'الاسم الكامل':'Full name'}<input value={edit.full_name} onChange={e=>setEdit(Object.assign({},edit,{full_name:e.target.value}))} className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-gold"/></label>
     <label className="text-sm font-semibold text-forest">{locale==='ar'?'البريد الإلكتروني':'Email'}<input type="email" value={edit.email} onChange={e=>setEdit(Object.assign({},edit,{email:e.target.value}))} className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-gold"/></label>
     <label className="text-sm font-semibold text-forest">{locale==='ar'?'رقم الجوال':'Phone'}<input value={edit.phone} onChange={e=>setEdit(Object.assign({},edit,{phone:e.target.value}))} className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-gold"/></label>
     <label className="text-sm font-semibold text-forest">{locale==='ar'?'الدور والصلاحية':'Role & permission'}<select value={edit.role} onChange={e=>setEdit(Object.assign({},edit,{role:e.target.value as Role}))} className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-gold">{['SUPER_ADMIN'].concat(roles).map(r=><option key={r} value={r}>{locale==='ar'?roleLabels[r as Role]:r}</option>)}</select></label>
    </div>
    <div className="mt-6 rounded-xl bg-[#f7f3ea] p-4"><div className="text-xs font-semibold text-forest/55">{locale==='ar'?'حالة الحساب':'Account status'}</div><div className="mt-2 font-semibold text-forest">{selected.banned?(locale==='ar'?'معطل':'Disabled'):(locale==='ar'?'نشط':'Active')}</div></div>
    <div className="mt-6 flex flex-col gap-3 border-t border-forest/10 pt-5">
     <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={()=>update(selected.id,{action:'active',active:selected.banned})} className="rounded-xl border border-forest/15 px-4 py-3 text-sm font-semibold text-forest hover:bg-[#f7f3ea]">{selected.banned?(locale==='ar'?'إعادة تفعيل الحساب':'Reactivate account'):(locale==='ar'?'تعطيل الحساب':'Disable account')}</button>
      <button type="button" disabled={busy} onClick={async()=>{if(!window.confirm(locale==='ar'?'هل أنت متأكد من حذف حساب هذا الموظف نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.':'Permanently delete this staff account? This cannot be undone.'))return;await update(selected.id,{action:'delete'});setSelected(null);}} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">{locale==='ar'?'حذف الحساب نهائيًا':'Delete permanently'}</button>
     </div>
     <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={closeProfile} className="btn btn-outline">{locale==='ar'?'إغلاق':'Close'}</button><button type="button" disabled={busy||!edit.full_name.trim()||edit.email.indexOf('@')<1} onClick={()=>update(selected.id,{action:'details',full_name:edit.full_name,email:edit.email,phone:edit.phone,role:edit.role})} className="btn btn-primary">{locale==='ar'?'حفظ التعديلات':'Save changes'}</button></div>
    </div>
   </div>
  </div>}
 </div>
}
