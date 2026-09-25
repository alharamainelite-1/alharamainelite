import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
const ROLES=['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS','HOST'];
const STATUS=['PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED'];
async function hostIdForStaff(staff:any){if(staff.profile.role!=='HOST')return null;const {data}=await getSupabaseAdmin().from('hosts').select('id').eq('user_id',staff.profile.id).maybeSingle();return data?.id||null;}
export async function POST(req:Request){const staff=await getCurrentStaff();if(!staff)return NextResponse.json({error:'Unauthorized.'},{status:401});if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:'Operations access required.'},{status:403});if(staff.profile.role==='HOST')return NextResponse.json({error:'Hosts can only update their assigned tasks.'},{status:403});const b=await req.json().catch(()=>null) as any;if(!b?.date||!b?.task_type)return NextResponse.json({error:'Date and task type are required.'},{status:400});const s=getSupabaseAdmin();if(b.host_id){const {data:conflict}=await s.from('host_tasks').select('id').eq('host_id',b.host_id).eq('date',b.date).neq('status','CANCELLED').lt('start_time',b.end_time||'23:59:59').gt('end_time',b.start_time||'00:00:00').limit(1);if(conflict?.length)return NextResponse.json({error:'Host has a conflicting task at this time.'},{status:409});}const {data,error}=await s.from('host_tasks').insert({task_id:'HT-'+Date.now().toString().slice(-8),group_id:b.group_id||null,booking_id:b.booking_id||null,host_id:b.host_id||null,date:b.date,start_time:b.start_time||null,end_time:b.end_time||null,location:b.location?String(b.location).slice(0,300):null,task_type:String(b.task_type).slice(0,120),notes:b.notes?String(b.notes).slice(0,4000):null,status:b.host_id?'ASSIGNED':'PENDING'}).select('*').single();if(error)return NextResponse.json({error:error.message},{status:500});await s.from('audit_logs').insert({actor_id:staff.profile.id,action:'HOST_TASK_CREATED',entity_type:'host_task',entity_id:data.id,after_data:data});revalidatePath('/admin/operations');return NextResponse.json({task:data},{status:201});}
export async function PATCH(req:Request){
 const staff=await getCurrentStaff(); if(!staff)return NextResponse.json({error:'Unauthorized.'},{status:401});
 const b=await req.json().catch(()=>null) as any; if(!b?.id||!STATUS.includes(b.status))return NextResponse.json({error:'Invalid task update.'},{status:400});
 const s=getSupabaseAdmin(); const {data:before}=await s.from('host_tasks').select('*').eq('id',b.id).single(); if(!before)return NextResponse.json({error:'Task not found.'},{status:404});
 if(staff.profile.role==='HOST'){
   const hostId=await hostIdForStaff(staff); if(!hostId||before.host_id!==hostId)return NextResponse.json({error:'You can only update tasks assigned to you.'},{status:403});
   const allowed:any={ASSIGNED:['ACCEPTED'],ACCEPTED:['IN_PROGRESS'],IN_PROGRESS:['COMPLETED']};
   if(!(allowed[before.status]||[]).includes(b.status))return NextResponse.json({error:'Invalid task transition.'},{status:403});
 }else if(!['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS'].includes(staff.profile.role))return NextResponse.json({error:'Operations access required.'},{status:403});
 const {data,error}=await s.from('host_tasks').update({status:b.status}).eq('id',b.id).select('*').single(); if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from('audit_logs').insert({actor_id:staff.profile.id,action:'HOST_TASK_STATUS_UPDATED',entity_type:'host_task',entity_id:b.id,before_data:before,after_data:data});
 revalidatePath('/admin/host-tasks'); revalidatePath('/admin/operations'); return NextResponse.json({task:data});
}
