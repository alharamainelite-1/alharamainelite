import Link from 'next/link';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {getAdminLocale} from '@/lib/admin-locale';

const MS_DAY=86400000;
function fmt(v:string|null,locale:'en'|'ar'='ar'){return v?new Date(v).toLocaleString(locale==='ar'?'ar-SA':'en-GB'):'—';}
function taskLabel(x:any,ar=false){const v=String(x.task_type||'Task');if(!ar)return v.replaceAll('_',' ');const m:any={AIRPORT_TRANSFER:'نقل من وإلى المطار',AIRPORT_ASSISTANCE:'مساعدة المطار',HOTEL_TRANSFER:'النقل إلى الفندق',TRAIN_ASSISTANCE:'مساعدة قطار الحرمين',MAKKAH_ZIYARAT:'زيارة مكة',MADINAH_ZIYARAT:'زيارة المدينة',JEDDAH_EXPERIENCE:'تجربة جدة',SPECIAL_ASSISTANCE:'مساعدة خاصة',OTHER:'أخرى'};return m[v]||v.replaceAll('_',' ');}
function slaState(x:any,now:number){
 const open=!['COMPLETED','CANCELLED'].includes(x.status);
 if(!open||!x.sla_due_at)return 'NO SLA';
 const due=new Date(x.sla_due_at).getTime();
 if(due<now)return 'OVERDUE';
 if(due-now<=60*60000)return 'DUE SOON';
 return 'ON TRACK';
}

export default async function StaffMonitoringPage({searchParams}:{searchParams:Promise<{staff?:string}>}){
 const staff=await getCurrentStaff();
 if(!staff||staff.profile.role!=='SUPER_ADMIN')return <section className="pb-12"><div className="card p-8"><h1 className="serif text-3xl text-forest">Access restricted</h1></div></section>;
 const locale=await getAdminLocale(); const ar=locale==='ar'; const selected=(await searchParams).staff||'';
 const s=getSupabaseAdmin(); const now=Date.now(); const today=new Date().toISOString().slice(0,10); const since=new Date(Date.now()-30*MS_DAY).toISOString();
 let profiles:any[]=[],activity:any[]=[],audit:any[]=[],tasks:any[]=[];let error='';
 try{
  const [p,a,l,t]=await Promise.all([
   s.from('profiles').select('id,full_name,role').order('full_name').limit(100),
   s.from('staff_activity').select('staff_id,event_type,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(3000),
   s.from('audit_logs').select('actor_id,action,entity_type,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(5000),
   s.from('operations_tasks').select('id,task_id,assigned_staff_id,date,start_time,end_time,task_type,location,status,notes,sla_due_at,started_at,completed_at').not('assigned_staff_id','is',null).limit(2000)
  ]);
  if(p.error||a.error||l.error||t.error)throw(p.error||a.error||l.error||t.error);
  profiles=p.data||[];activity=a.data||[];audit=l.data||[];tasks=t.data||[];
 }catch(e){error=e instanceof Error?e.message:'Unable to load staff monitoring.'}
 const byId=new Map(profiles.map(p=>[p.id,{...p,logins:0,lastLogin:null as string|null,lastActivity:null as string|null,tasks:[] as any[],actions:0}]));
 for(const x of activity){const p=byId.get(x.staff_id);if(!p)continue;if(x.event_type==='LOGIN'){p.logins++;if(!p.lastLogin)p.lastLogin=x.created_at;}if(!p.lastActivity||new Date(x.created_at)>new Date(p.lastActivity))p.lastActivity=x.created_at;}
 for(const x of audit){const p=byId.get(x.actor_id);if(!p)continue;p.actions++;if(!p.lastActivity||new Date(x.created_at)>new Date(p.lastActivity))p.lastActivity=x.created_at;}
 for(const x of tasks){const p=byId.get(x.assigned_staff_id);if(p)p.tasks.push(x);}
 const allOpen=tasks.filter(x=>!['COMPLETED','CANCELLED'].includes(x.status));
 const overdue=allOpen.filter(x=>slaState(x,now)==='OVERDUE');
 const dueSoon=allOpen.filter(x=>slaState(x,now)==='DUE SOON');
 const completed=tasks.filter(x=>x.status==='COMPLETED');
 const onTime=completed.filter(x=>x.completed_at&&x.sla_due_at&&new Date(x.completed_at).getTime()<=new Date(x.sla_due_at).getTime()).length;
 const slaRate=completed.filter(x=>x.completed_at&&x.sla_due_at).length?Math.round(onTime/completed.filter(x=>x.completed_at&&x.sla_due_at).length*100):0;
 const selectedProfile=profiles.find(p=>p.id===selected)||null; const selectedData=selectedProfile?byId.get(selectedProfile.id):null;
 const summary=(p:any)=>{const ts=p?.tasks||[];const open=ts.filter((x:any)=>!['COMPLETED','CANCELLED'].includes(x.status));const todayTasks=ts.filter((x:any)=>x.date===today);const unstarted=ts.filter((x:any)=>['PENDING','ASSIGNED'].includes(x.status));const over=open.filter((x:any)=>slaState(x,now)==='OVERDUE');const soon=open.filter((x:any)=>slaState(x,now)==='DUE SOON');return{open,todayTasks,unstarted,over,soon};};
 const selectedSummary=selectedData?summary(selectedData):null;
 return <section className="pb-12">
  <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow">{locale==='ar'?'رقابة الأداء':'Staff oversight'}</div><h1 className="serif mt-2 text-4xl text-forest">{locale==='ar'?'متابعة الموظفين':'Staff Monitoring'}</h1><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'متابعة تشغيلية للمهام والمواعيد والإجراءات.':'Operational monitoring of tasks, SLA deadlines and recorded actions.'}</p></div><div className="rounded-xl bg-[#f7f3ea] px-4 py-3 text-xs text-forest/60">{ar?'آخر 30 يومًا':'Last 30 days'}</div></div>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{(ar?[['الموظفون',profiles.length],['تسجيلات الدخول',activity.filter(x=>x.event_type==='LOGIN').length],['الإجراءات المسجلة',audit.length],['المهام المفتوحة',allOpen.length],['تجاوز SLA',overdue.length],['الالتزام بالوقت',completed.filter(x=>x.completed_at&&x.sla_due_at).length?slaRate+'%':'—']]:[['Staff',profiles.length],['Logins',activity.filter(x=>x.event_type==='LOGIN').length],['Recorded actions',audit.length],['Open tasks',allOpen.length],['Overdue SLA',overdue.length],['SLA on-time',completed.filter(x=>x.completed_at&&x.sla_due_at).length?slaRate+'%':'—'] ]).map(([k,v])=><div className="card p-5" key={String(k)}><div className="text-xs uppercase tracking-[.16em] text-forest/40">{k}</div><div className="serif mt-2 text-3xl text-forest">{String(v)}</div></div>)}</div>
  {dueSoon.length>0&&<div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>{ar?dueSoon.length+' مهام مستحقة خلال 60 دقيقة.':dueSoon.length+' task(s) due within 60 minutes.'}</strong> {ar?'راجع التعيينات أدناه.':'Review the assignments below.'}</div>}
  {overdue.length>0&&<div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><strong>{ar?overdue.length+' مهام مفتوحة تجاوزت زمن SLA.':overdue.length+' open task(s) are past their SLA.'}</strong> {ar?'تحتاج إلى متابعة تشغيلية.':'These require operational follow-up.'}</div>}

  <div className="card mt-6 overflow-x-auto"><div className="p-5"><h2 className="serif text-2xl text-forest">{ar?'نشاط الموظفين':'Employee activity'}</h2><p className="mt-1 text-xs text-forest/45">{ar?'بيانات تشغيلية فقط؛ لا تتم مراقبة الأجهزة الشخصية أو التصفح الخاص.':'Operational facts only; no private-device or personal browsing monitoring.'}</p></div><table className="w-full min-w-[1300px] text-left text-sm"><thead className="border-y border-forest/10 bg-[#faf8f2]"><tr>{(ar?['الموظف','الدور','تسجيلات الدخول','آخر دخول','الإجراءات','اليوم','المفتوحة','تجاوز SLA','قريب الاستحقاق','لم تبدأ','آخر نشاط']:['Employee','Role','Logins','Last login','Actions','Today','Open','SLA overdue','Due soon','Unstarted','Last activity']).map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>{profiles.map(p=>{const x=byId.get(p.id);const z=summary(x);return <tr key={p.id} className="border-b border-forest/8"><td className="px-4 py-4 font-semibold"><Link className="hover:text-gold" href={'/admin/staff-monitoring?staff='+p.id}>{p.full_name||'Unnamed'}</Link></td><td className="px-4 py-4">{p.role}</td><td className="px-4 py-4">{x?.logins||0}</td><td className="px-4 py-4 text-xs">{fmt(x?.lastLogin,locale)}</td><td className="px-4 py-4">{x?.actions||0}</td><td className="px-4 py-4">{z.todayTasks.length}</td><td className="px-4 py-4">{z.open.length}</td><td className="px-4 py-4">{z.over.length}</td><td className="px-4 py-4">{z.soon.length}</td><td className="px-4 py-4">{z.unstarted.length}</td><td className="px-4 py-4 text-xs">{fmt(x?.lastActivity,locale)}</td></tr>})}</tbody></table></div>

  {selectedProfile&&selectedData&&selectedSummary&&<div className="mt-6 card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow">{ar?'ملف الموظف':'EMPLOYEE PROFILE'}</div><h2 className="serif mt-2 text-3xl text-forest">{selectedProfile.full_name||'Unnamed'}</h2><p className="mt-1 text-sm text-forest/50">{selectedProfile.role}</p></div><Link href="/admin/staff-monitoring" className="btn btn-outline">{ar?'إغلاق':'Close'}</Link></div>
   <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{(ar?[['اليوم',selectedSummary.todayTasks.length],['المفتوحة',selectedSummary.open.length],['تجاوز SLA',selectedSummary.over.length],['قريب الاستحقاق',selectedSummary.soon.length],['لم تبدأ',selectedSummary.unstarted.length],['الإجراءات',selectedData.actions]]:[['Today',selectedSummary.todayTasks.length],['Open',selectedSummary.open.length],['SLA overdue',selectedSummary.over.length],['Due soon',selectedSummary.soon.length],['Unstarted',selectedSummary.unstarted.length],['Actions',selectedData.actions]]).map(([k,v])=><div className="rounded-xl bg-[#f7f3ea] p-4" key={String(k)}><div className="text-xs text-forest/45">{k}</div><div className="serif mt-1 text-2xl text-forest">{String(v)}</div></div>)}</div>
   <div className="mt-6"><h3 className="font-semibold text-forest">{ar?'المهام المسندة وSLA':'Assigned work & SLA'}</h3><div className="mt-3 grid gap-3">{selectedData.tasks.length?selectedData.tasks.sort((a:any,b:any)=>String(a.date).localeCompare(String(b.date))).slice(0,100).map((x:any)=>{const state=slaState(x,now);return <div key={x.id} className="rounded-xl border border-forest/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold text-gold">{x.task_id}</div><div className="mt-1 font-semibold text-forest">{taskLabel(x,ar)}</div><div className="mt-1 text-xs text-forest/45">{x.date||'—'} · {x.start_time||'—'}{x.end_time?' – '+x.end_time:''} · {x.location||'—'}</div></div><div className="text-right"><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{(ar?({PENDING:'معلقة',ASSIGNED:'مسندة',ACCEPTED:'مقبولة',IN_PROGRESS:'قيد التنفيذ',COMPLETED:'مكتملة',CANCELLED:'ملغاة'} as any)[x.status]||x.status:String(x.status||'PENDING').replaceAll('_',' '))}</span><div className="mt-2 text-xs font-semibold">{ar?(state==='OVERDUE'?'متأخرة':state==='DUE SOON'?'قريبة الاستحقاق':state==='ON TRACK'?'ضمن الوقت':'بدون SLA'):state}{x.sla_due_at?(ar?' · الاستحقاق ':' · due ')+fmt(x.sla_due_at,locale):''}</div></div></div></div>}) : <div className="text-sm text-forest/45">{ar?'لا توجد مهام مسندة.':'No assigned tasks.'}</div>}</div></div>
   <div className="mt-6"><h3 className="font-semibold text-forest">{ar?'آخر الإجراءات المسجلة':'Recent recorded actions'}</h3><div className="mt-3 space-y-2">{audit.filter((x:any)=>x.actor_id===selectedProfile.id).slice(0,30).map((x:any,i:number)=><div key={i} className="flex flex-wrap justify-between gap-3 border-b border-forest/8 py-3 text-sm"><span>{x.action} · {x.entity_type}</span><span className="text-xs text-forest/45">{fmt(x.created_at,locale)}</span></div>)}</div></div>
  </div>}
 </section>;
}
