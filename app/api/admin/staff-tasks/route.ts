import { NextResponse } from 'next/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const MANAGERS = ['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'];
const OPEN_STATUSES = ['ASSIGNED','ACCEPTED','IN_PROGRESS'];
async function audit(s:any, actorId:string, action:string, before:any, after:any) {
  const { error } = await s.from('audit_logs').insert({actor_id:actorId,action,entity_type:'staff_task',entity_id:after?.id||before?.id,before_data:before||null,after_data:after||null});
  if(error) console.error('staff_task_audit_failed',{code:error.code,action});
}
function jsonError(message:string,status=400){return NextResponse.json({error:message},{status});}

export async function GET() {
  const staff=await getCurrentStaff();
  if(!staff)return jsonError('Unauthorized.',401);
  const s=getSupabaseAdmin();
  const {data:teamRows,error:teamError}=await s.from('profiles').select('id,full_name,role,department,manager_id').order('full_name').limit(500);
  if(teamError)return jsonError('Unable to load staff directory.',500);
  const team=teamRows||[];
  const canOversee=staff.profile.role==='SUPER_ADMIN'||MANAGERS.includes(staff.profile.role);
  const visibleIds=canOversee?team.filter((p:any)=>staff.profile.role==='SUPER_ADMIN'||p.manager_id===staff.profile.id||p.id===staff.profile.id).map((p:any)=>p.id):[staff.profile.id];
  let query=s.from('staff_tasks').select('*').order('created_at',{ascending:false}).limit(500);
  if(!(canOversee&&staff.profile.role==='SUPER_ADMIN')){
    const ids=[...new Set([...visibleIds,staff.profile.id])];
    const clauses=['assigned_staff_id.in.('+ids.join(',')+')','created_by.eq.'+staff.profile.id,'handover_to_staff_id.eq.'+staff.profile.id];
    query=query.or(clauses.join(','));
  }
  const {data,error}=await query;
  if(error)return jsonError('Unable to load staff tasks. Apply the staff-task migration first if this feature was just deployed.',500);
  return NextResponse.json({tasks:data||[],staff:team.map((p:any)=>({id:p.id,name:p.full_name||'Staff member',role:p.role,department:p.department,manager_id:p.manager_id})),currentStaffId:staff.profile.id,currentRole:staff.profile.role,canAssign:canOversee});
}

export async function POST(req:Request) {
  const staff=await getCurrentStaff();
  if(!staff)return jsonError('Unauthorized.',401);
  const body=await req.json().catch(()=>null) as any;
  if(body?.action==='sales_handover'){
    if(!['SALES','SUPER_ADMIN'].includes(staff.profile.role))return jsonError('Only Sales can hand a qualified customer to Bookings.',403);
    if(typeof body.request_id!=='string'||typeof body.assigned_staff_id!=='string'||typeof body.note!=='string'||body.note.trim().length<5||body.note.trim().length>1000)return jsonError('Request, Booking assignee and a handover note of 5–1000 characters are required.');
    const s=getSupabaseAdmin();
    const {data:request,error:requestError}=await s.from('journey_requests').select('id,reference,guest_count,status,expected_period_label,lead_source,packages(name,slug)').eq('id',body.request_id).maybeSingle();
    if(requestError)return jsonError('Unable to load the journey request.',500);
    if(!request)return jsonError('Journey request not found.',404);
    if(!['DETAILS_PENDING','PAYMENT_PENDING'].includes(String(request.status)))return jsonError('Sales must complete customer qualification before handing the request to Bookings.',409);
    const {data:assignee,error:assigneeError}=await s.from('profiles').select('id,role,department').eq('id',body.assigned_staff_id).maybeSingle();
    if(assigneeError||!assignee||assignee.role!=='BOOKINGS')return jsonError('Choose an active employee from the Bookings team.',400);
    const title='Booking intake: '+String(request.reference||request.id);
    const {data:existing}=await s.from('staff_tasks').select('id,status').eq('title',title).in('status',OPEN_STATUSES).limit(1).maybeSingle();
    if(existing)return jsonError('This request already has an open handover to Bookings.',409);
    const {data:booking}=await s.from('bookings').select('id,booking_id,status').eq('request_id',request.id).is('archived_at',null).maybeSingle();
    const pkg=(request as any).packages||{};
    const details=[
      'Journey request: '+String(request.reference||request.id),
      'Request ID: '+request.id,
      'Linked booking: '+String(booking?.booking_id||'Not found yet'),
      'Booking status: '+String(booking?.status||'Not created'),
      'Package: '+String(pkg.name||'Not provided'),
      'Guests: '+String(request.guest_count||'Not provided'),
      'Expected travel period: '+String(request.expected_period_label||'To be confirmed'),
      'Sales handover note: '+body.note.trim()
    ].join('\\n');
    const due=new Date(Date.now()+24*60*60*1000).toISOString();
    const {data:task,error}=await s.from('staff_tasks').insert({task_code:'ST-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,8).toUpperCase(),title,description:details,department:'BOOKINGS',priority:'NORMAL',status:'ASSIGNED',assigned_staff_id:assignee.id,created_by:staff.profile.id,due_at:due}).select('*').single();
    if(error)return jsonError('Could not create the Bookings handover task.',500);
    await audit(s,staff.profile.id,'SALES_HANDED_REQUEST_TO_BOOKINGS',null,{task,request_id:request.id,booking_staff_id:assignee.id});
    return NextResponse.json({task});
  }
  if(!(staff.profile.role==='SUPER_ADMIN'||MANAGERS.includes(staff.profile.role)))return jsonError('Only management can assign new staff tasks.',403);
  if(!body||typeof body.title!=='string'||body.title.trim().length<3||body.title.trim().length>180||typeof body.assigned_staff_id!=='string')return jsonError('Task title and assignee are required.');
  const s=getSupabaseAdmin();
  const {data:assignee,error:assigneeError}=await s.from('profiles').select('id,role,department,manager_id').eq('id',body.assigned_staff_id).maybeSingle();
  if(assigneeError||!assignee)return jsonError('The selected assignee does not exist.',404);
  if(assignee.role==='SUPER_ADMIN')return jsonError('Tasks cannot be assigned to the General Manager from this workflow.');
  if(staff.profile.role!=='SUPER_ADMIN'&&assignee.manager_id!==staff.profile.id)return jsonError('You may assign tasks only to your direct reports.',403);
  const allowedPriority=['LOW','NORMAL','HIGH','URGENT'];
  const due=body.due_at?new Date(body.due_at):null;
  if(body.due_at&&(!due||Number.isNaN(due.getTime())))return jsonError('Invalid due date.');
  const row={task_code:'ST-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,8).toUpperCase(),title:body.title.trim(),description:typeof body.description==='string'?body.description.trim().slice(0,4000):null,department:assignee.department||'OPERATIONS',priority:allowedPriority.includes(body.priority)?body.priority:'NORMAL',status:'ASSIGNED',assigned_staff_id:assignee.id,created_by:staff.profile.id,due_at:due?.toISOString()||null};
  const {data,error}=await s.from('staff_tasks').insert(row).select('*').single();
  if(error)return jsonError('Could not create the task. Confirm the staff-task migration is installed.',500);
  await audit(s,staff.profile.id,'STAFF_TASK_ASSIGNED',null,data);
  return NextResponse.json({task:data});
}

export async function PATCH(req:Request) {
  const staff=await getCurrentStaff();
  if(!staff)return jsonError('Unauthorized.',401);
  const body=await req.json().catch(()=>null) as any;
  if(!body||typeof body.id!=='string'||typeof body.action!=='string')return jsonError('Task and action are required.');
  const s=getSupabaseAdmin();
  const {data:before,error:readError}=await s.from('staff_tasks').select('*').eq('id',body.id).maybeSingle();
  if(readError)return jsonError('Unable to load task.',500);
  if(!before)return jsonError('Task not found.',404);
  const isOwner=before.assigned_staff_id===staff.profile.id;
  const isRecipient=before.handover_to_staff_id===staff.profile.id;
  const isManager=staff.profile.role==='SUPER_ADMIN'||(MANAGERS.includes(staff.profile.role)&&(before.created_by===staff.profile.id||before.assigned_staff_id===staff.profile.id));
  let patch:any={updated_at:new Date().toISOString()};
  let event='';
  if(body.action==='accept'){
    if(!isOwner||before.status!=='ASSIGNED')return jsonError('Only the assigned employee can accept an assigned task.',403);
    patch.status='ACCEPTED';patch.accepted_at=new Date().toISOString();event='STAFF_TASK_ACCEPTED';
  }else if(body.action==='start'){
    if(!isOwner||before.status!=='ACCEPTED')return jsonError('Accept the task before starting it.',403);
    patch.status='IN_PROGRESS';patch.started_at=new Date().toISOString();event='STAFF_TASK_STARTED';
  }else if(body.action==='complete'){
    if(!isOwner||before.status!=='IN_PROGRESS')return jsonError('Only the assigned employee can complete a task in progress.',403);
    if(typeof body.note==='string'&&body.note.trim())patch.completed_note=body.note.trim().slice(0,2000);
    patch.status='COMPLETED';patch.completed_at=new Date().toISOString();event='STAFF_TASK_COMPLETED';
  }else if(body.action==='request_handover'){
    if(!isOwner||!OPEN_STATUSES.includes(before.status))return jsonError('Only the current assignee can request handover for an open task.',403);
    if(typeof body.to_staff_id!=='string'||body.to_staff_id===staff.profile.id||typeof body.note!=='string'||body.note.trim().length<5||body.note.trim().length>1000)return jsonError('Choose another employee and provide a handover note of 5–1000 characters.');
    const {data:target}=await s.from('profiles').select('id,role,department,manager_id').eq('id',body.to_staff_id).maybeSingle();
    if(!target||target.role==='SUPER_ADMIN')return jsonError('The handover recipient is invalid.',400);
    const {data:current}=await s.from('profiles').select('manager_id,department').eq('id',staff.profile.id).maybeSingle();
    const sameDepartment=!!current?.department&&current.department===target.department;
    const managerRelation=target.id===current?.manager_id||target.manager_id===staff.profile.id;
    if(!sameDepartment&&!managerRelation)return jsonError('Handover is allowed only within the same department or to/from the direct manager.',403);
    if(before.handover_status==='PENDING')return jsonError('A handover request is already pending.',409);
    patch.handover_status='PENDING';patch.handover_from_staff_id=staff.profile.id;patch.handover_to_staff_id=target.id;patch.handover_note=body.note.trim();patch.handover_requested_at=new Date().toISOString();patch.handover_decided_at=null;event='STAFF_TASK_HANDOVER_REQUESTED';
  }else if(body.action==='accept_handover'||body.action==='reject_handover'){
    if(!isRecipient||before.handover_status!=='PENDING')return jsonError('Only the named recipient can respond to this handover.',403);
    patch.handover_status=body.action==='accept_handover'?'ACCEPTED':'REJECTED';patch.handover_decided_at=new Date().toISOString();
    if(body.action==='accept_handover'){patch.assigned_staff_id=staff.profile.id;patch.status='ASSIGNED';patch.accepted_at=null;patch.started_at=null;patch.completed_at=null;patch.completed_note=null;}
    event=body.action==='accept_handover'?'STAFF_TASK_HANDOVER_ACCEPTED':'STAFF_TASK_HANDOVER_REJECTED';
  }else if(body.action==='cancel'){
    if(!isManager)return jsonError('Only the task creator or management may cancel this task.',403);
    if(!OPEN_STATUSES.includes(before.status))return jsonError('Only open tasks can be cancelled.',409);
    if(typeof body.note!=='string'||body.note.trim().length<5)return jsonError('A cancellation reason of at least 5 characters is required.');
    patch.status='CANCELLED';patch.completed_note=body.note.trim().slice(0,2000);event='STAFF_TASK_CANCELLED';
  }else return jsonError('Unsupported task action.');
  const {data:after,error:updateError}=await s.from('staff_tasks').update(patch).eq('id',before.id).select('*').single();
  if(updateError||!after)return jsonError('Could not update task.',500);
  await audit(s,staff.profile.id,event,before,after);
  return NextResponse.json({task:after});
}
