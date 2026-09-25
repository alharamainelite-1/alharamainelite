import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {getAdminLocale} from '@/lib/admin-locale';

export default async function StaffMonitoringPage(){
 const staff=await getCurrentStaff(); if(!staff||staff.profile.role!=='SUPER_ADMIN')return <section className="pb-12"><div className="card p-8"><h1 className="serif text-3xl text-forest">Access restricted</h1><p className="mt-2 text-sm text-forest/55">Only the Super Admin can view staff monitoring.</p></div></section>;
 const locale=await getAdminLocale(); const s=getSupabaseAdmin(); const since=new Date(Date.now()-30*24*60*60*1000).toISOString();
 let profiles:any[]=[],activity:any[]=[],audit:any[]=[],tasks:any[]=[]; let error='';
 try{
  const [p,a,l,t]=await Promise.all([
   s.from('profiles').select('id,full_name,role').order('full_name').limit(100),
   s.from('staff_activity').select('staff_id,event_type,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(2000),
   s.from('audit_logs').select('actor_id,action,entity_type,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(3000),
   s.from('operations_tasks').select('id,task_id,assigned_staff_id,date,status').not('assigned_staff_id','is',null).gte('date',new Date().toISOString().slice(0,10)).limit(1000)
  ]);
  if(p.error||a.error||l.error||t.error)throw(p.error||a.error||l.error||t.error);
  profiles=p.data||[];activity=a.data||[];audit=l.data||[];tasks=t.data||[];
 }catch(e){error=e instanceof Error?e.message:'Unable to load staff monitoring.'}
 const byId=new Map(profiles.map(p=>[p.id,{...p,logins:0,lastLogin:null as string|null,lastActivity:null as string|null,actions:0,tasks:0,completed:0,open:0}]));
 for(const x of activity){const p=byId.get(x.staff_id);if(!p)continue;if(x.event_type==='LOGIN'){p.logins++;if(!p.lastLogin)p.lastLogin=x.created_at;}if(!p.lastActivity)p.lastActivity=x.created_at;}
 for(const x of audit){const p=byId.get(x.actor_id);if(!p)continue;p.actions++;if(!p.lastActivity||new Date(x.created_at)>new Date(p.lastActivity))p.lastActivity=x.created_at;}
 for(const x of tasks){const p=byId.get(x.assigned_staff_id);if(!p)continue;p.tasks++;if(x.status==='COMPLETED')p.completed++;else if(x.status!=='CANCELLED')p.open++;}
 const totals={staff:profiles.length,logins:activity.filter(x=>x.event_type==='LOGIN').length,actions:audit.length,open:tasks.filter(x=>x.status!=='COMPLETED'&&x.status!=='CANCELLED').length,completed:tasks.filter(x=>x.status==='COMPLETED').length};
 return <section className="pb-12">
  <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow">{locale==='ar'?'رقابة الأداء':'Staff oversight'}</div><h1 className="serif mt-2 text-4xl text-forest">{locale==='ar'?'متابعة الموظفين':'Staff Monitoring'}</h1><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'سجل تشغيلي شفاف لآخر 30 يوماً: الدخول، الإجراءات والمهام.':'A transparent 30-day operational view of sign-ins, actions and assigned tasks.'}</p></div><div className="rounded-xl bg-[#f7f3ea] px-4 py-3 text-xs text-forest/60">Last 30 days</div></div>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[['Staff',totals.staff],['Logins',totals.logins],['Recorded actions',totals.actions],['Open tasks',totals.open],['Completed tasks',totals.completed]].map(([k,v])=><div className="card p-5" key={String(k)}><div className="text-xs uppercase tracking-[.16em] text-forest/40">{k}</div><div className="serif mt-2 text-3xl text-forest">{String(v)}</div></div>)}</div>
  <div className="card mt-6 overflow-x-auto"><div className="p-5"><h2 className="serif text-2xl text-forest">Employee activity</h2><p className="mt-1 text-xs text-forest/45">Operational facts only. This does not record private browsing or personal-device activity.</p></div><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-y border-forest/10 bg-[#faf8f2]"><tr>{['Employee','Role','Logins','Last login','Actions','Assigned tasks','Completed','Open tasks','Last activity'].map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>{profiles.map(p=>{const x=byId.get(p.id);return <tr key={p.id} className="border-b border-forest/8"><td className="px-4 py-4 font-semibold">{p.full_name||'Unnamed'}</td><td className="px-4 py-4">{p.role}</td><td className="px-4 py-4">{x?.logins||0}</td><td className="px-4 py-4 text-xs">{x?.lastLogin?new Date(x.lastLogin).toLocaleString('en-GB'):'—'}</td><td className="px-4 py-4">{x?.actions||0}</td><td className="px-4 py-4">{x?.tasks||0}</td><td className="px-4 py-4">{x?.completed||0}</td><td className="px-4 py-4">{x?.open||0}</td><td className="px-4 py-4 text-xs">{x?.lastActivity?new Date(x.lastActivity).toLocaleString('en-GB'):'—'}</td></tr>})}</tbody></table></div>
  <div className="card mt-6 p-6"><h2 className="serif text-2xl text-forest">Recent operational activity</h2><div className="mt-4 space-y-2">{audit.slice(0,20).map((x:any,i)=><div key={i} className="flex flex-wrap justify-between gap-3 border-b border-forest/8 py-3 text-sm"><span><b>{profiles.find(p=>p.id===x.actor_id)?.full_name||'System'}</b> · {x.action} · {x.entity_type}</span><span className="text-xs text-forest/45">{new Date(x.created_at).toLocaleString('en-GB')}</span></div>)}</div></div>
 </section>;
}
