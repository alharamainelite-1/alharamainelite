'use client';
import {useEffect,useState} from 'react';
import {adminText} from '@/lib/admin-text';

type Role='SUPER_ADMIN'|'OPERATIONS_MANAGER'|'OPERATIONS_SUPERVISOR'|'JOURNEY_COORDINATOR'|'OPERATIONS'|'SALES'|'MARKETING'|'CUSTOMER_SERVICE'|'FINANCE'|'HOST';
type Compensation={staff_id:string;base_salary:number;currency:'USD'|'SAR';pay_frequency:string;effective_from:string;notes?:string|null};
type Bonus={id:string;staff_id:string;amount:number;currency:'USD'|'SAR';bonus_date:string;reason:string;status:string;approved_at?:string|null;paid_at?:string|null;notes?:string|null};
type User={id:string;email:string;full_name:string;phone:string;role:Role;manager_id:string|null;manager_name?:string|null;department:string;permissions:Record<string,Record<string,boolean>>;created_at:string;email_confirmed:boolean;banned:boolean;compensation:Compensation|null;bonuses:Bonus[]};
const roles:Role[]=['OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','SALES','MARKETING','CUSTOMER_SERVICE','JOURNEY_COORDINATOR','OPERATIONS','HOST','FINANCE'];
const roleLabels:Record<Role,string>={SUPER_ADMIN:'الإدارة العامة',OPERATIONS_MANAGER:'مدير العمليات',OPERATIONS_SUPERVISOR:'مشرف العمليات',JOURNEY_COORDINATOR:'منسق العمليات',OPERATIONS:'موظف العمليات',SALES:'المبيعات والحجوزات',MARKETING:'التسويق',CUSTOMER_SERVICE:'خدمة العملاء',FINANCE:'المالية',HOST:'المضيف'};
const managerRoles:Record<Role,Role[]>={SUPER_ADMIN:[],OPERATIONS_MANAGER:['SUPER_ADMIN'],OPERATIONS_SUPERVISOR:['OPERATIONS_MANAGER'],SALES:['OPERATIONS_MANAGER'],MARKETING:['OPERATIONS_MANAGER'],CUSTOMER_SERVICE:['OPERATIONS_MANAGER'],JOURNEY_COORDINATOR:['OPERATIONS_SUPERVISOR'],OPERATIONS:['OPERATIONS_SUPERVISOR'],HOST:['JOURNEY_COORDINATOR'],FINANCE:['SUPER_ADMIN']};
const departmentLabels:Record<string,{ar:string;en:string}>={GENERAL_MANAGEMENT:{ar:'الإدارة العامة',en:'General Management'},OPERATIONS:{ar:'العمليات',en:'Operations'},SALES:{ar:'المبيعات والحجوزات',en:'Sales & Bookings'},MARKETING:{ar:'التسويق',en:'Marketing'},CUSTOMER_SERVICE:{ar:'خدمة العملاء',en:'Customer Service'},FINANCE:{ar:'المالية',en:'Finance'}};
const permissionAreas=[{key:'requests',ar:'طلبات الرحلات',en:'Journey requests'},{key:'guests',ar:'العملاء',en:'Customers'},{key:'bookings',ar:'الحجوزات',en:'Bookings'},{key:'operations',ar:'العمليات والمهام',en:'Operations & tasks'},{key:'groups',ar:'المجموعات',en:'Groups'},{key:'resources',ar:'الموارد',en:'Resources'},{key:'transportation',ar:'النقل والمركبات',en:'Transportation'},{key:'communications',ar:'التواصل',en:'Communications'},{key:'payments',ar:'المدفوعات',en:'Payments'},{key:'expenses',ar:'المصروفات',en:'Expenses'},{key:'reports',ar:'التقارير',en:'Reports'},{key:'hosts',ar:'المضيفون',en:'Hosts'}];
const permissionActions=[{key:'view',ar:'عرض',en:'View'},{key:'create',ar:'إنشاء',en:'Create'},{key:'edit',ar:'تعديل',en:'Edit'},{key:'assign',ar:'إسناد',en:'Assign'},{key:'approve',ar:'اعتماد',en:'Approve'}];
function defaultManager(role:Role,users:User[],excludeId?:string){const allowed=managerRoles[role]||[];return users.find(u=>u.id!==excludeId&&!u.banned&&allowed.includes(u.role))?.id||'';}
function defaultDepartment(role:Role){if(role==='SUPER_ADMIN')return 'GENERAL_MANAGEMENT';if(['SALES'].includes(role))return 'SALES';if(role==='MARKETING')return 'MARKETING';if(role==='CUSTOMER_SERVICE')return 'CUSTOMER_SERVICE';if(role==='FINANCE')return 'FINANCE';return 'OPERATIONS';}
function defaultPermission(role:Role,area:string,action:string){
 if(role==='SUPER_ADMIN')return true;
 const map:Record<string,Record<string,string[]>>={
  OPERATIONS_MANAGER:{guests:['view'],journeys:['view'],bookings:['view'],operations:['view','create','edit','assign'],groups:['view','create','edit','assign'],resources:['view','create','edit','assign'],hosts:['view','create','edit','assign'],hotels:['view','create','edit','assign'],train:['view','create','edit','assign'],transportation:['view','create','edit','assign'],expenses:['view','create']},
  OPERATIONS_SUPERVISOR:{operations:['view','create','edit','assign'],groups:['view','create','edit','assign'],resources:['view','create','edit','assign'],hosts:['view','create','edit','assign'],hotels:['view','create','edit','assign'],train:['view','create','edit','assign'],transportation:['view','create','edit','assign'],expenses:['view','create']},
  JOURNEY_COORDINATOR:{operations:['view','create','edit','assign'],groups:['view'],resources:['view','assign'],expenses:['view','create']},
  OPERATIONS:{operations:['view','edit'],transportation:['view']},
  SALES:{requests:['view','create','edit'],guests:['view','edit'],journeys:['view','edit'],bookings:['view','create','edit'],communications:['view','create','edit']},
  MARKETING:{communications:['view','create','edit']},
  CUSTOMER_SERVICE:{requests:['view','edit'],guests:['view','edit'],journeys:['view'],bookings:['view','edit'],communications:['view','create','edit']},
  FINANCE:{bookings:['view'],payments:['view','create','approve'],expenses:['view','approve'],reports:['view'],finance:['view']},
  HOST:{hostTasks:['view','edit']}
 };
 return (map[role]?.[area]||[]).includes(action);
}
const descriptions:Record<Role,{en:string;ar:string}>={
 SUPER_ADMIN:{en:'Full control, staff accounts, permissions, settings, finance and all operations.',ar:'صلاحية كاملة تشمل الموظفين والصلاحيات والإعدادات والمالية والعمليات.'},
 OPERATIONS_SUPERVISOR:{en:'Supervises journey preparation, coordinators, task quality and operational readiness.',ar:'يشرف على تجهيز الرحلات والمنسقين وجودة المهام والجاهزية التشغيلية.'},
 MARKETING:{en:'Manages marketing campaigns, content, partners and lead-generation activity.',ar:'إدارة الحملات والمحتوى والشركاء التسويقيين وجذب العملاء.'},
 CUSTOMER_SERVICE:{en:'Handles customer questions, service updates and complaint follow-up.',ar:'متابعة استفسارات العملاء وتحديثاتهم وشكاواهم.'},
 OPERATIONS_MANAGER:{en:'Owns journey readiness, groups, hotels, transport, train, hosts and operational tasks.',ar:'مسؤول عن جاهزية الرحلات والمجموعات والفنادق والنقل والقطار والمضيفين والمهام التشغيلية.'},
 JOURNEY_COORDINATOR:{en:'Owns assigned journeys, coordinates the group schedule and assigns host tasks for those journeys.',ar:'مسؤول عن الرحلات المسندة إليه، وتنسيق جدول المجموعة وإسناد مهام المضيفين ضمن رحلاته.'},
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
 const [edit,setEdit]=useState({full_name:'',email:'',phone:'',role:'SALES' as Role,manager_id:''});
 const [editPermissions,setEditPermissions]=useState<Record<string,Record<string,boolean>>>({});
 const [password,setPassword]=useState('');
 const [passwordMsg,setPasswordMsg]=useState('');
 const [salary,setSalary]=useState('');
 const [salaryCurrency,setSalaryCurrency]=useState<'SAR'|'USD'>('SAR');
 const [payFrequency,setPayFrequency]=useState('MONTHLY');
 const [effectiveFrom,setEffectiveFrom]=useState(new Date().toISOString().slice(0,10));
 const [salaryMsg,setSalaryMsg]=useState('');
 const [bonusAmount,setBonusAmount]=useState('');
 const [bonusReason,setBonusReason]=useState('');
 const [bonusCurrency,setBonusCurrency]=useState<'SAR'|'USD'>('SAR');
 const [bonusDate,setBonusDate]=useState(new Date().toISOString().slice(0,10));
 const [bonusMsg,setBonusMsg]=useState('');
 const [form,setForm]=useState({full_name:'',email:'',phone:'',role:'SALES' as Role,manager_id:''});
 const t=adminText[locale];

 useEffect(()=>{const m=document.cookie.match(/(?:^|; )he_locale=([^;]+)/);if(m&&m[1]==='en')setLocale('en');},[]);
 async function load(){
  setLoading(true);
  const r=await fetch('/api/admin/team',{cache:'no-store'});
  const j=await r.json();
  if(r.ok){const list:User[]=j.users||[];setUsers(list);setForm(old=>({...old,manager_id:old.manager_id||defaultManager(old.role,list)}));setLoading(false);return list;}
  setMessage(j.error||'Unable to load team.');
  setLoading(false);
  return null;
 }
 useEffect(()=>{load();},[]);

 async function create(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage('');
  const r=await fetch('/api/admin/team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
  const j=await r.json();
  setMessage(r.ok?t.invitationSent:j.error||'Unable to create account.');
  if(r.ok){setForm({full_name:'',email:'',phone:'',role:'SALES',manager_id:defaultManager('SALES',users)});await load();}
  setBusy(false);
 }
 async function update(userId:string,body:Record<string,unknown>){
  setBusy(true);setMessage('');
  const r=await fetch('/api/admin/team',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({userId},body))});
  const j=await r.json();
  if(r.ok){setMessage(locale==='ar'?'تم تحديث الحساب بنجاح.':'Account updated successfully.');const list=await load();const fresh=list?.find(u=>u.id===userId);if(fresh)setSelected(fresh);}
  else setMessage(j.error||'Unable to update account.');
  setBusy(false);
 }
 function openProfile(u:User){
  setSelected(u);
  setEdit({full_name:u.full_name,email:u.email,phone:u.phone||'',role:u.role,manager_id:u.manager_id||''});
  setEditPermissions(u.permissions||{});
  setPassword('');
  setPasswordMsg('');
  setSalary(u.compensation?String(u.compensation.base_salary):'');
  setSalaryCurrency(u.compensation?.currency==='USD'?'USD':'SAR');
  setPayFrequency(u.compensation?.pay_frequency||'MONTHLY');
  setEffectiveFrom(u.compensation?.effective_from||new Date().toISOString().slice(0,10));
  setSalaryMsg('');
  setBonusAmount('');
  setBonusReason('');
  setBonusCurrency('SAR');
  setBonusDate(new Date().toISOString().slice(0,10));
  setBonusMsg('');
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
     <select value={form.role} onChange={e=>{const role=e.target.value as Role;setForm(old=>({...old,role,manager_id:defaultManager(role,users)}));}} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm outline-none">
      {roles.map(r=><option key={r} value={r}>{locale==='ar'?roleLabels[r]:r.replaceAll('_',' ')}</option>)}
     </select>
     <label className="grid gap-2 text-sm font-semibold text-forest">{locale==='ar'?'المدير المباشر':'Direct manager'}<select value={form.manager_id} onChange={e=>setForm(old=>({...old,manager_id:e.target.value}))} required className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm font-normal outline-none"><option value="">{locale==='ar'?'اختر المدير المباشر':'Select direct manager'}</option>{users.filter(u=>managerRoles[form.role].includes(u.role)&&!u.banned).map(u=><option key={u.id} value={u.id}>{u.full_name||u.email} — {locale==='ar'?roleLabels[u.role]:u.role.replaceAll('_',' ')}</option>)}</select><span className="text-xs font-normal text-forest/45">{locale==='ar'?'القسم: ':'Department: '}{locale==='ar'?departmentLabels[defaultDepartment(form.role)]?.ar:departmentLabels[defaultDepartment(form.role)]?.en}</span></label>
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
     <td className="px-5 py-5"><div className="font-semibold text-forest">{u.full_name||'—'}</div><div className="text-xs text-forest/45">{u.email}</div>{u.phone&&<div className="text-xs text-forest/45">{u.phone}</div>}<div className="mt-1 text-xs text-forest/45">{locale==='ar'?'المدير: ':'Manager: '}{u.manager_name|| (u.role==='SUPER_ADMIN'?(locale==='ar'?'لا يوجد':'None'):(locale==='ar'?'غير محدد':'Unassigned'))}</div><div className="text-xs text-forest/45">{locale==='ar'?departmentLabels[u.department]?.ar||u.department:departmentLabels[u.department]?.en||u.department}</div></td>
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
     <label className="text-sm font-semibold text-forest">{locale==='ar'?'الدور الوظيفي':'Role'}<select value={edit.role} onChange={e=>{const role=e.target.value as Role;setEdit(old=>({...old,role,manager_id:defaultManager(role,users,selected?.id)}));}} className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-gold">{['SUPER_ADMIN'].concat(roles).map(r=><option key={r} value={r}>{locale==='ar'?roleLabels[r as Role]:r.replaceAll('_',' ')}</option>)}</select></label>
     <label className="text-sm font-semibold text-forest">{locale==='ar'?'المدير المباشر':'Direct manager'}<select value={edit.manager_id} onChange={e=>setEdit(old=>({...old,manager_id:e.target.value}))} disabled={edit.role==='SUPER_ADMIN'} className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-gold"><option value="">{edit.role==='SUPER_ADMIN'?(locale==='ar'?'لا يوجد — الإدارة العامة':'None — General Management'):(locale==='ar'?'اختر المدير المباشر':'Select direct manager')}</option>{users.filter(u=>u.id!==selected.id&&managerRoles[edit.role].includes(u.role)&&!u.banned).map(u=><option key={u.id} value={u.id}>{u.full_name||u.email} — {locale==='ar'?roleLabels[u.role]:u.role.replaceAll('_',' ')}</option>)}</select><span className="mt-1 block text-xs font-normal text-forest/45">{locale==='ar'?'القسم: ':'Department: '}{locale==='ar'?departmentLabels[defaultDepartment(edit.role)]?.ar:departmentLabels[defaultDepartment(edit.role)]?.en}</span></label>
    </div>
    <div className="mt-6 rounded-xl border border-forest/10 bg-white p-5"><div className="eyebrow">{locale==='ar'?'الصلاحيات التفصيلية':'Fine-grained permissions'}</div><p className="mt-2 text-xs leading-5 text-forest/55">{locale==='ar'?'يمكنك إيقاف صلاحية محددة لهذا الموظف. تظل قيود الدور الأساسي مطبقة ولا يمكن تجاوزها من هذه القائمة.':'You can deny specific actions for this employee. Base role restrictions remain enforced and cannot be bypassed here.'}</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr><th className="p-2 text-start">{locale==='ar'?'القسم':'Area'}</th>{permissionActions.map(a=><th key={a.key} className="p-2 text-center">{locale==='ar'?a.ar:a.en}</th>)}</tr></thead><tbody>{permissionAreas.map(area=><tr key={area.key} className="border-t border-forest/10"><td className="p-2 font-semibold">{locale==='ar'?area.ar:area.en}</td>{permissionActions.map(action=>{const allowed=editPermissions[area.key]?.[action.key]??defaultPermission(edit.role,area.key,action.key);return <td key={action.key} className="p-2 text-center"><input aria-label={`${area.key} ${action.key}`} type="checkbox" checked={allowed} disabled={selected.role==='SUPER_ADMIN'} onChange={e=>setEditPermissions(old=>({...old,[area.key]:{...(old[area.key]||{}),[action.key]:e.target.checked}}))}/></td>})}</tr>)}</tbody></table></div></div>
    <div className="mt-6 rounded-xl bg-[#f7f3ea] p-4"><div className="text-xs font-semibold text-forest/55">{locale==='ar'?'حالة الحساب':'Account status'}</div><div className="mt-2 font-semibold text-forest">{selected.banned?(locale==='ar'?'معطل':'Disabled'):(locale==='ar'?'نشط':'Active')}</div></div>
    <div className="mt-6 rounded-xl border border-gold/20 bg-[#fffaf0] p-5">
     <div className="eyebrow">{locale==='ar'?'الملف المالي للموظف':'Employee finance'}</div>
     <h4 className="serif mt-2 text-2xl text-forest">{locale==='ar'?'الراتب والمكافآت':'Salary & bonuses'}</h4>
     <p className="mt-2 text-sm leading-6 text-forest/55">{locale==='ar'?'إدارة الراتب الأساسي، دورية الصرف، والمكافآت مع حفظ السجل المالي للموظف.':'Manage base salary, pay frequency and bonuses with a financial history.'}</p>
     <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold text-forest">{locale==='ar'?'الراتب الأساسي':'Base salary'}<input type="number" min="0" step="0.01" value={salary} onChange={e=>setSalary(e.target.value)} className="mt-2 w-full"/></label>
      <label className="text-sm font-semibold text-forest">{locale==='ar'?'العملة':'Currency'}<select value={salaryCurrency} onChange={e=>setSalaryCurrency(e.target.value as 'SAR'|'USD')} className="mt-2 w-full"><option value="SAR">SAR</option><option value="USD">USD</option></select></label>
      <label className="text-sm font-semibold text-forest">{locale==='ar'?'دورية الراتب':'Pay frequency'}<select value={payFrequency} onChange={e=>setPayFrequency(e.target.value)} className="mt-2 w-full"><option value="MONTHLY">{locale==='ar'?'شهري':'Monthly'}</option><option value="WEEKLY">{locale==='ar'?'أسبوعي':'Weekly'}</option><option value="BIWEEKLY">{locale==='ar'?'كل أسبوعين':'Biweekly'}</option></select></label>
      <label className="text-sm font-semibold text-forest">{locale==='ar'?'ساري من':'Effective from'}<input type="date" value={effectiveFrom} onChange={e=>setEffectiveFrom(e.target.value)} className="mt-2 w-full"/></label>
     </div>
     <button type="button" disabled={busy||!salary||Number(salary)<0} onClick={async()=>{
      setBusy(true);setSalaryMsg('');
      try{const r=await fetch('/api/admin/finance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'compensation',staff_id:selected.id,base_salary:Number(salary),currency:salaryCurrency,pay_frequency:payFrequency,effective_from:effectiveFrom})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to save salary.');setSalaryMsg(locale==='ar'?'تم حفظ الراتب الأساسي.':'Base salary saved.');await load();}
      catch(e){setSalaryMsg(e instanceof Error?e.message:'Unable to save salary.')}finally{setBusy(false)}
     }} className="btn btn-primary mt-4">{locale==='ar'?'حفظ الراتب':'Save salary'}</button>
     {salaryMsg&&<p className="mt-3 text-sm text-forest/60">{salaryMsg}</p>}

     <div className="mt-6 border-t border-forest/10 pt-5">
      <div className="font-semibold text-forest">{locale==='ar'?'إضافة مكافأة':'Add bonus'}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
       <input type="number" min="0.01" step="0.01" value={bonusAmount} onChange={e=>setBonusAmount(e.target.value)} placeholder={locale==='ar'?'قيمة المكافأة':'Bonus amount'}/>
       <select value={bonusCurrency} onChange={e=>setBonusCurrency(e.target.value as 'SAR'|'USD')}><option value="SAR">SAR</option><option value="USD">USD</option></select>
       <input type="date" value={bonusDate} onChange={e=>setBonusDate(e.target.value)}/>
       <input value={bonusReason} onChange={e=>setBonusReason(e.target.value)} placeholder={locale==='ar'?'سبب المكافأة':'Bonus reason'}/>
      </div>
      <button type="button" disabled={busy||!bonusAmount||Number(bonusAmount)<=0||!bonusReason.trim()} onClick={async()=>{
       setBusy(true);setBonusMsg('');
       try{const r=await fetch('/api/admin/finance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'bonus',staff_id:selected.id,amount:Number(bonusAmount),currency:bonusCurrency,bonus_date:bonusDate,reason:bonusReason.trim()})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to add bonus.');setBonusAmount('');setBonusReason('');setBonusMsg(locale==='ar'?'تمت إضافة المكافأة واعتمادها.':'Bonus added and approved.');await load();const fresh=(await fetch('/api/admin/team',{cache:'no-store'})).json();const data=await fresh;const updated=(data.users||[]).find((u:User)=>u.id===selected.id);if(updated)setSelected(updated);}
       catch(e){setBonusMsg(e instanceof Error?e.message:'Unable to add bonus.')}finally{setBusy(false)}
      }} className="btn btn-primary mt-4">{locale==='ar'?'إضافة المكافأة':'Add bonus'}</button>
      {bonusMsg&&<p className="mt-3 text-sm text-forest/60">{bonusMsg}</p>}
     </div>

     <div className="mt-6 rounded-xl border border-forest/10 bg-white p-4">
      <div className="text-sm font-semibold text-forest">{locale==='ar'?'سجل المكافآت':'Bonus history'}</div>
      <div className="mt-3 grid gap-2">{selected.bonuses.length?selected.bonuses.map(b=><div key={b.id} className="flex flex-col gap-1 rounded-lg bg-[#f7f3ea] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>{b.reason}</span><span className="font-semibold">{Number(b.amount).toLocaleString()} {b.currency} · {b.status}</span></div>):<div className="text-sm text-forest/45">{locale==='ar'?'لا توجد مكافآت مسجلة.':'No bonuses recorded.'}</div>}</div>
     </div>
    </div>
    <div className="mt-6 rounded-xl border border-forest/10 bg-white p-5">
     <div className="eyebrow">{locale==='ar'?'صلاحية الدخول':'Account access'}</div>
     <h4 className="serif mt-2 text-2xl text-forest">{locale==='ar'?'تغيير كلمة مرور الموظف':'Reset employee password'}</h4>
     <p className="mt-2 text-sm leading-6 text-forest/55">{locale==='ar'?'يمكن للمدير العام تعيين كلمة مرور جديدة دون معرفة كلمة المرور الحالية. لا يتم عرض كلمة المرور الحالية في أي وقت.':'The Super Admin can set a new password without viewing the existing password.'}</p>
     <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <input type="password" minLength={8} autoComplete="new-password" placeholder={locale==='ar'?'كلمة المرور الجديدة (8 أحرف فأكثر)':'New password (8+ characters)'} value={password} onChange={e=>{setPassword(e.target.value);setPasswordMsg('')}} className="min-w-0 flex-1"/>
      <button type="button" disabled={busy} onClick={async()=>{
       const value=password.trim();
       if(value.length<8){setPasswordMsg(locale==='ar'?'كلمة المرور يجب أن تكون 8 أحرف على الأقل.':'Password must be at least 8 characters.');return}
       if(!window.confirm(locale==='ar'?'هل أنت متأكد من تعيين كلمة المرور الجديدة لهذا الموظف؟':'Set this new password for this employee?'))return;
       setBusy(true);setPasswordMsg('');
       try{
        const r=await fetch('/api/admin/team',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:selected.id,newPassword:value})});
        const j=await r.json();
        if(!r.ok)throw new Error(j.error||'Unable to reset password.');
        setPassword('');
        setPasswordMsg(locale==='ar'?'تم تغيير كلمة المرور بنجاح. أرسل كلمة المرور الجديدة للموظف عبر قناة آمنة.':'Password changed successfully. Share the new password with the employee through a secure channel.');
       }catch(e){setPasswordMsg(e instanceof Error?e.message:(locale==='ar'?'تعذر تغيير كلمة المرور.':'Unable to reset password.'))}
       finally{setBusy(false)}
      }} className="btn btn-primary whitespace-nowrap">{locale==='ar'?'تغيير كلمة المرور':'Set new password'}</button>
     </div>
     {passwordMsg&&<p className="mt-3 text-sm text-forest/60">{passwordMsg}</p>}
    </div>
    <div className="mt-6 flex flex-col gap-3 border-t border-forest/10 pt-5">
     <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={()=>update(selected.id,{action:'active',active:selected.banned})} className="rounded-xl border border-forest/15 px-4 py-3 text-sm font-semibold text-forest hover:bg-[#f7f3ea]">{selected.banned?(locale==='ar'?'إعادة تفعيل الحساب':'Reactivate account'):(locale==='ar'?'تعطيل الحساب':'Disable account')}</button>
      <button type="button" disabled={busy} onClick={async()=>{if(!window.confirm(locale==='ar'?'هل أنت متأكد من حذف حساب هذا الموظف نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.':'Permanently delete this staff account? This cannot be undone.'))return;await update(selected.id,{action:'delete'});setSelected(null);}} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">{locale==='ar'?'حذف الحساب نهائيًا':'Delete permanently'}</button>
     </div>
     <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={closeProfile} className="btn btn-outline">{locale==='ar'?'إغلاق':'Close'}</button><button type="button" disabled={busy||!edit.full_name.trim()||edit.email.indexOf('@')<1} onClick={()=>update(selected.id,{action:'details',full_name:edit.full_name,email:edit.email,phone:edit.phone,role:edit.role,manager_id:edit.manager_id||null,permissions:editPermissions})} className="btn btn-primary">{locale==='ar'?'حفظ التعديلات':'Save changes'}</button></div>
    </div>
   </div>
  </div>}
 </div>
}
