import {getSupabaseAdmin} from '@/lib/supabase/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getAdminLocale} from '@/lib/admin-locale';
import {adminText} from '@/lib/admin-text';
import {HostTaskStatusButton} from '@/components/admin/HostTaskStatusButton';

export default async function HostTasksPage(){
  const staff=await getCurrentStaff(); if(!staff)return null;
  if(staff.profile.role!=='HOST')return <section className="pb-12"><div className="card p-8"><h1 className="serif text-3xl text-forest">Access restricted</h1></div></section>;
  const locale=await getAdminLocale(); const t=adminText[locale];
  const s=getSupabaseAdmin();
  const {data:host}=await s.from('hosts').select('id,name').eq('user_id',staff.profile.id).maybeSingle();
  if(!host)return <section className="pb-12"><div className="card p-8"><div className="eyebrow">Host workspace</div><h1 className="serif mt-2 text-3xl text-forest">No host profile is linked</h1><p className="mt-3 text-sm text-forest/55">Ask the Operations Manager to link your staff account to a host profile.</p></div></section>;
  const {data:tasks,error}=await s.from('host_tasks').select('id,task_id,date,start_time,end_time,location,task_type,status,notes,group_id,booking_id').eq('host_id',host.id).order('date',{ascending:true}).order('start_time',{ascending:true}).limit(100);
  return <section className="pb-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow">Host workspace</div><h1 className="serif mt-2 text-4xl text-forest">{host.name}</h1><p className="mt-2 text-sm text-forest/55">Only your assigned tasks are shown here.</p></div><div className="rounded-xl bg-white px-4 py-3 text-sm text-forest shadow-sm">{tasks?.filter(x=>!['COMPLETED','CANCELLED'].includes(x.status)).length||0} active tasks</div></div>
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>}
    <div className="mt-7 grid gap-4">{(!tasks||tasks.length===0)?<div className="card p-10 text-center text-forest/45">No assigned tasks yet.</div>:tasks.map(task=><div key={task.id} className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-semibold tracking-wider text-gold">{task.task_id}</div><h2 className="mt-1 text-lg font-semibold text-forest">{String(task.task_type||'Task').replaceAll('_',' ')}</h2></div><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{String(task.status||'PENDING').replaceAll('_',' ')}</span></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><div className="text-xs text-forest/40">Date</div><div className="mt-1 font-semibold text-forest">{task.date||'—'}</div></div><div><div className="text-xs text-forest/40">Time</div><div className="mt-1 font-semibold text-forest">{task.start_time||'—'}{task.end_time?' – '+task.end_time:''}</div></div><div><div className="text-xs text-forest/40">Location</div><div className="mt-1 font-semibold text-forest">{task.location||'—'}</div></div><div><div className="text-xs text-forest/40">Group</div><div className="mt-1 font-semibold text-forest">{task.group_id||'—'}</div></div></div>
      {task.notes&&<div className="mt-4 rounded-xl bg-[#f7f3ea] p-4 text-sm leading-6 text-forest/70">{task.notes}</div>}
      {task.status!=='COMPLETED'&&task.status!=='CANCELLED'&&<div className="mt-5"><HostTaskStatusButton id={task.id} nextStatus={task.status==='ASSIGNED'?'ACCEPTED':task.status==='ACCEPTED'?'IN_PROGRESS':'COMPLETED'} label={task.status==='ASSIGNED'?'Accept task':task.status==='ACCEPTED'?'Start task':'Mark completed'}/></div>}
    </div>)}</div>
  </section>;
}
