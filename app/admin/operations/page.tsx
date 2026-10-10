import {getSupabaseAdmin} from '@/lib/supabase/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {OperationsTaskForm} from '@/components/admin/OperationsTaskForm';
import {OperationsAssignmentForm} from '@/components/admin/OperationsAssignmentForm';
import {OperationsResourceForm} from '@/components/admin/OperationsResourceForm';
import {HostTaskCancellationForm} from '@/components/admin/HostTaskCancellationForm';
import {OperationsCalendar} from '@/components/admin/OperationsCalendar';
import {ExpenseForm} from '@/components/admin/ExpenseForm';
import {getAdminLocale} from '@/lib/admin-locale'; import {adminText} from '@/lib/admin-text';

export default async function OperationsPage(){
 const staff=await getCurrentStaff(); if(!staff)return null;
 const locale=await getAdminLocale(); const t=adminText[locale];
 let rows:any[]=[];let hosts:any[]=[];let vehicles:any[]=[];let team:any[]=[];let assignedGroups:any[]=[];let legacyHostTasks:any[]=[];let error='';
 const canManage=['SUPER_ADMIN','OPERATIONS_MANAGER'].includes(staff.profile.role);\n const isCoordinator=staff.profile.role==='JOURNEY_COORDINATOR';\n  try{
  const s=getSupabaseAdmin();
  const isWorker=staff.profile.role==='OPERATIONS';
  const [tasks,hs,vs,ts]=await Promise.all([
   (()=>{let q=s.from('operations_tasks').select('id,task_id,group_id,date,start_time,end_time,task_type,lead_source,assigned_host,assigned_vehicle,assigned_staff_id,location,status,notes').order('date',{ascending:true}).order('start_time',{ascending:true}).limit(100);if(isWorker)q=q.eq('assigned_staff_id',staff.profile.id);if(isCoordinator){const {data:owned}=await s.from('groups').select('id').eq('operations_coordinator_id',staff.profile.id).limit(200);const ids=(owned||[]).map((g:any)=>g.id);if(ids.length)q=q.in('group_id',ids);else q=q.eq('id','00000000-0000-0000-0000-000000000000');}return q;})(),
   s.from('hosts').select('id,name').order('name').limit(100),
   s.from('vehicles').select('id,vehicle_id').order('vehicle_id').limit(100),
   s.from('profiles').select('id,full_name,role').in('role',['OPERATIONS','OPERATIONS_MANAGER']).order('full_name').limit(100)
  ]);
  const e=tasks.error||hs.error||vs.error||ts.error;if(e)throw e;
  rows=tasks.data||[];hosts=hs.data||[];vehicles=vs.data||[];team=(ts.data||[]).map((x:any)=>({id:x.id,name:x.full_name||x.role}));
  let groupQuery=s.from('groups').select('id,group_id,operations_coordinator_id').order('departure_period_start',{ascending:true}).limit(200);
  if(isWorker||isCoordinator)groupQuery=groupQuery.eq('operations_coordinator_id',staff.profile.id);
  const groupResult=await groupQuery;
  if(groupResult.error)throw groupResult.error;
  assignedGroups=groupResult.data||[];
  if(canManage){const ht=await s.from('host_tasks').select('id,task_id,host_id,date,start_time,end_time,task_type,status,location,notes,cancellation_reason,cancelled_at').order('date',{ascending:true}).limit(100);if(ht.error)throw ht.error;legacyHostTasks=ht.data||[];}
 }catch(e){error=e instanceof Error?e.message:'Unable to load operations.'}
 return <section className="pb-12">
  {(canManage||isCoordinator)&&<OperationsTaskForm groups={assignedGroups.map((g:any)=>({id:g.id,group_id:g.group_id}))} requireGroup={isCoordinator}/>}
  <h1 className="serif text-4xl text-forest">{t.page.operations}</h1>
  <div className="mt-6 card p-5">
   <h2 className="serif text-2xl text-forest">{locale==='ar'?'تسجيل مصروف رحلة':'Record a journey expense'}</h2>
   <p className="mt-2 text-sm text-forest/55">{locale==='ar'?'سجّل مصروف الفندق أو النقل أو الفعاليات وارفق بيانات المورد. ستبقى الإجماليات والأرباح المالية محصورة في الإدارة والمالية.':'Record hotel, transport or activity expenses. Financial totals and profitability remain restricted to management and finance.'}</p>
   <ExpenseForm groups={assignedGroups.map((g:any)=>({id:g.id,group_id:g.group_id}))} requireGroup={['OPERATIONS','OPERATIONS_MANAGER'].includes(staff.profile.role)}/>
  </div>
  <p className="mt-2 text-sm text-forest/55">{staff.profile.role==='OPERATIONS'?(locale==='ar'?'هذه قائمة المهام المسندة إليك فقط.':'Only operational tasks assigned to you are shown.'):t.common.operationsDesc}</p>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4">{error}</div>}
  <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead><tr>{(locale==='ar'?['المهمة','المصدر','النوع','التاريخ','الوقت','المجموعة','الموظف المسند','المضيف','المركبة','الموقع','الحالة','تحديث']:['Task','Source','Type','Date','Time','Group','Assigned staff','Host','Vehicle','Location','Status','Update']).map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead>
   <tbody>{rows.length===0?<tr><td colSpan={12} className="p-12 text-center text-forest/45">{t.common.noTasks}</td></tr>:rows.map(r=><tr key={r.id}>
    <td className="px-4 py-4 font-semibold">{r.task_id||'—'}</td><td className="px-4 py-4">{r.lead_source==='WOMENS_UMRAH'?<span className="inline-flex rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-bold text-forest">{locale==='ar'?'عمرة النساء':'Women’s Umrah'}</span>:<span className="text-xs text-forest/45">{locale==='ar'?'الموقع':'Website'}</span>}</td><td className="px-4 py-4">{r.task_type||'—'}</td><td className="px-4 py-4">{r.date||'—'}</td><td className="px-4 py-4">{r.start_time||'—'}{r.end_time?' – '+r.end_time:''}</td><td className="px-4 py-4">{r.group_id||'—'}</td>
    <td className="px-4 py-4">{team.find((x:any)=>x.id===r.assigned_staff_id)?.name||(locale==='ar'?'غير مسند':'Unassigned')}</td><td className="px-4 py-4">{r.assigned_host||(locale==='ar'?'غير مسند':'Unassigned')}</td><td className="px-4 py-4">{r.assigned_vehicle||(locale==='ar'?'غير مسند':'Unassigned')}</td><td className="px-4 py-4">{r.location||'—'}</td><td className="px-4 py-4">{r.status||'—'}</td>
    <td className="px-4 py-4">{canManage?<><OperationsAssignmentForm id={r.id} currentStatus={r.status}/><OperationsResourceForm id={r.id} hostId={r.assigned_host} vehicleId={r.assigned_vehicle} staffId={r.assigned_staff_id} hosts={hosts} vehicles={vehicles} staff={team}/></>:isCoordinator?<OperationsResourceForm id={r.id} hostId={r.assigned_host} vehicleId={r.assigned_vehicle} staffId={r.assigned_staff_id} hosts={hosts} vehicles={vehicles} staff={team}/>:<OperationsAssignmentForm id={r.id} currentStatus={r.status}/ >}</td>
   </tr>)}</tbody>
  </table></div>
  {canManage&&<div className="mt-8"><h2 className="serif text-2xl text-forest">{locale==='ar'?'مهام المضيفين القديمة':'Legacy host tasks'}</h2><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'يمكن للإدارة إلغاء المهمة مع تسجيل السبب، وسيظهر السبب للمضيف.':'Management can cancel a legacy host task with an audited reason, which remains visible to the host.'}</p><div className="card mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr>{(locale==='ar'?['المهمة','المضيف','التاريخ','الوقت','النوع','الحالة','سبب الإلغاء / الإجراء']:['Task','Host','Date','Time','Type','Status','Cancellation reason / action']).map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>{legacyHostTasks.length===0?<tr><td colSpan={7} className="p-8 text-center text-forest/45">{locale==='ar'?'لا توجد مهام مضيفين قديمة.':'No legacy host tasks.'}</td></tr>:legacyHostTasks.map(task=><tr key={task.id} className="border-t border-forest/10"><td className="px-4 py-4 font-semibold">{task.task_id||task.id}</td><td className="px-4 py-4">{hosts.find((h:any)=>h.id===task.host_id)?.name||'—'}</td><td className="px-4 py-4">{task.date||'—'}</td><td className="px-4 py-4">{task.start_time||'—'}{task.end_time?' – '+task.end_time:''}</td><td className="px-4 py-4">{task.task_type||'—'}</td><td className="px-4 py-4">{task.status||'—'}</td><td className="px-4 py-4">{task.status==='CANCELLED'?<div className="max-w-xs text-xs text-forest/65">{task.cancellation_reason|| (locale==='ar'?'لا يوجد سبب مسجل':'No reason recorded')}{task.cancelled_at&&<div className="mt-1">{new Date(task.cancelled_at).toLocaleString(locale==='ar'?'ar-SA':'en-GB')}</div>}</div>:task.status==='COMPLETED'?<span className="text-xs text-forest/55">{locale==='ar'?'مكتملة':'Completed'}</span>:<HostTaskCancellationForm id={task.id} currentStatus={task.status||'PENDING'} locale={locale}/>}</td></tr>)}</tbody></table></div></div>}
  <OperationsCalendar rows={rows}/>
 </section>
}