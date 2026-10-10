import{NextResponse}from"next/server";
import{revalidatePath}from"next/cache";
import{getCurrentStaff,hasStaffPermission}from"@/lib/supabase/auth";
import{getSupabaseAdmin}from"@/lib/supabase/server";

const ROLES=["SUPER_ADMIN","OPERATIONS_MANAGER","OPERATIONS_SUPERVISOR","JOURNEY_COORDINATOR","OPERATIONS"];
const STATUS=["PENDING","ASSIGNED","ACCEPTED","IN_PROGRESS","COMPLETED","VERIFIED","CLOSED","CANCELLED"];
const LEAD_SOURCES=["PUBLIC","WOMENS_UMRAH"]; const TASK_TYPES=["AIRPORT_TRANSFER","AIRPORT_ASSISTANCE","HOTEL_TRANSFER","TRAIN_ASSISTANCE","MAKKAH_ZIYARAT","MADINAH_ZIYARAT","JEDDAH_EXPERIENCE","SPECIAL_ASSISTANCE","OTHER"];

function getSlaBase(date:string,startTime?:string|null){
  const base=startTime?new Date(`${date}T${startTime}:00`):new Date(`${date}T00:00:00`);
  return Number.isNaN(base.getTime())?null:base;
}

export async function POST(req:Request){
  const staff=await getCurrentStaff();
  if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
  if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Operations access required."},{status:403});
  if(staff.profile.role==="OPERATIONS")return NextResponse.json({error:"Operations staff can only update assigned tasks."},{status:403});
  if(!hasStaffPermission(staff,"operations","create"))return NextResponse.json({error:"You do not have permission to create operational tasks."},{status:403});
  const b=await req.json().catch(()=>null)as any;
  if(!b?.date||!b?.task_type)return NextResponse.json({error:"Date and task type are required."},{status:400});
  if(!TASK_TYPES.includes(String(b.task_type)))return NextResponse.json({error:"Invalid task type."},{status:400});
  if(b.lead_source!==undefined&&!LEAD_SOURCES.includes(String(b.lead_source)))return NextResponse.json({error:"Invalid journey source."},{status:400});
  if(b.start_time&&b.end_time&&b.end_time<=b.start_time)return NextResponse.json({error:"End time must be after start time."},{status:400});
  const s=getSupabaseAdmin();
  if(staff.profile.role==="JOURNEY_COORDINATOR"){if(!b.group_id)return NextResponse.json({error:"A journey group is required."},{status:400});const {data:ownedGroup}=await s.from("groups").select("id").eq("id",b.group_id).eq("operations_coordinator_id",staff.profile.id).maybeSingle();if(!ownedGroup)return NextResponse.json({error:"You can only create tasks for journeys assigned to you."},{status:403});}
  if(b.assigned_staff_id){
    const {data:assignedStaff}=await s.from("profiles").select("id,role").eq("id",b.assigned_staff_id).maybeSingle();
    if(!assignedStaff)return NextResponse.json({error:"Assigned staff member was not found."},{status:404});
    if(!["OPERATIONS_MANAGER","OPERATIONS"].includes(String(assignedStaff.role)))return NextResponse.json({error:"Only Operations Manager or Operations staff can be assigned to an operations task."},{status:400});
  }
  if(b.assigned_host){
    const {data:host}=await s.from("hosts").select("id,status").eq("id",b.assigned_host).maybeSingle();
    if(!host)return NextResponse.json({error:"Assigned host was not found."},{status:404});
    if(["OFF_DUTY","UNAVAILABLE"].includes(String(host.status)))return NextResponse.json({error:"The selected host is not available."},{status:409});

    const q=s.from("operations_tasks").select("id").eq("assigned_host",b.assigned_host).eq("date",b.date).neq("status","CANCELLED");
    if(b.start_time&&b.end_time)q.lt("start_time",b.end_time).gt("end_time",b.start_time);
    const {data:conflict}=await q.limit(1);
    if(conflict?.length)return NextResponse.json({error:"Host has a conflicting task at this time."},{status:409});
  }
  if(b.assigned_vehicle){
    const {data:vehicle}=await s.from("vehicles").select("id,status").eq("id",b.assigned_vehicle).maybeSingle();
    if(!vehicle)return NextResponse.json({error:"Assigned vehicle was not found."},{status:404});
    if(["INACTIVE","UNAVAILABLE","OUT_OF_SERVICE"].includes(String(vehicle.status)))return NextResponse.json({error:"The selected vehicle is not available."},{status:409});

    const q=s.from("operations_tasks").select("id").eq("assigned_vehicle",b.assigned_vehicle).eq("date",b.date).neq("status","CANCELLED");
    if(b.start_time&&b.end_time)q.lt("start_time",b.end_time).gt("end_time",b.start_time);
    const {data:conflict}=await q.limit(1);
    if(conflict?.length)return NextResponse.json({error:"Vehicle has a conflicting task at this time."},{status:409});
  }
  const{data:sla}=await s.from("operations_task_slas").select("target_minutes").eq("task_type",String(b.task_type)).eq("active",true).maybeSingle();
  const base=getSlaBase(String(b.date),b.start_time||null);
  const slaDueAt=sla?.target_minutes&&base?new Date(base.getTime()+Number(sla.target_minutes)*60000).toISOString():null;
  const{data,error}=await s.from("operations_tasks").insert({
    task_id:"OT-"+Date.now().toString().slice(-8),
    group_id:b.group_id||null,
    date:b.date,
    start_time:b.start_time||null,
    end_time:b.end_time||null,
    task_type:String(b.task_type),
    lead_source:String(b.lead_source||"PUBLIC"),
    assigned_host:b.assigned_host||null,
    assigned_vehicle:b.assigned_vehicle||null,
    assigned_staff_id:b.assigned_staff_id||null,
    location:b.location?String(b.location).slice(0,300):null,
    status:b.assigned_host||b.assigned_vehicle||b.assigned_staff_id?"ASSIGNED":"PENDING",
    notes:b.notes?String(b.notes).slice(0,4000):null,
    sla_due_at:slaDueAt
  }).select("*").single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"OPERATIONS_TASK_CREATED",entity_type:"operations_task",entity_id:data.id,after_data:data});
  revalidatePath("/admin/operations");revalidatePath("/admin/staff-monitoring");
  return NextResponse.json({task:data},{status:201});
}

export async function PATCH(req:Request){
  const staff=await getCurrentStaff();
  if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
  if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Operations access required."},{status:403});
  const b=await req.json().catch(()=>null)as any;
  if(!b?.id)return NextResponse.json({error:"Task id is required."},{status:400});
  const s=getSupabaseAdmin();
  const{data:before}=await s.from("operations_tasks").select("*").eq("id",b.id).single();
  if(!before)return NextResponse.json({error:"Task not found."},{status:404});
  if(staff.profile.role==="OPERATIONS"&&before.assigned_staff_id!==staff.profile.id)return NextResponse.json({error:"You can only update tasks assigned to you."},{status:403});
  if(staff.profile.role==="JOURNEY_COORDINATOR"){const {data:ownedGroup}=before.group_id?await s.from("groups").select("id").eq("id",before.group_id).eq("operations_coordinator_id",staff.profile.id).maybeSingle():{data:null};if(!ownedGroup)return NextResponse.json({error:"You can only access tasks for journeys assigned to you."},{status:403});if(b.status!==undefined)return NextResponse.json({error:"Coordinators assign and monitor tasks; execution status is updated by the assigned worker."},{status:403});}
  const update:any={};
  if(b.status!==undefined&&!hasStaffPermission(staff,"operations","edit"))return NextResponse.json({error:"You do not have permission to update task status."},{status:403});
  if(b.status==="CANCELLED"&&!hasStaffPermission(staff,"operations","approve"))return NextResponse.json({error:"You do not have permission to approve task cancellation."},{status:403});
  if(b.status!==undefined){
    if(!STATUS.includes(b.status))return NextResponse.json({error:"Invalid task status."},{status:400});
    if(staff.profile.role==="OPERATIONS"){const allowed:any={PENDING:["ACCEPTED"],ASSIGNED:["ACCEPTED"],ACCEPTED:["IN_PROGRESS"],IN_PROGRESS:["COMPLETED"]};if(!(allowed[before.status]||[]).includes(b.status))return NextResponse.json({error:"Invalid task transition."},{status:403});}
    const managers=["SUPER_ADMIN","OPERATIONS_MANAGER","OPERATIONS_SUPERVISOR"];
    if(b.status==="VERIFIED"){
      if(!managers.includes(staff.profile.role))return NextResponse.json({error:"Only management can verify completed tasks."},{status:403});
      if(before.status!=="COMPLETED")return NextResponse.json({error:"Only completed tasks can be verified."},{status:409});
      update.verified_at=new Date().toISOString();update.verified_by=staff.profile.id;
    } else if(b.status==="CLOSED"){
      if(!managers.includes(staff.profile.role))return NextResponse.json({error:"Only management can close verified tasks."},{status:403});
      if(before.status!=="VERIFIED")return NextResponse.json({error:"Verify the task before closing it."},{status:409});
      update.closed_at=new Date().toISOString();update.closed_by=staff.profile.id;
    } else if(!["OPERATIONS","HOST"].includes(staff.profile.role)&&b.status!=="CANCELLED"){
      const managementTransitions:any={PENDING:["ASSIGNED"],ASSIGNED:[],COMPLETED:[],VERIFIED:[],CLOSED:[]};
      if(!(managementTransitions[before.status]||[]).includes(b.status))return NextResponse.json({error:"This status transition is not allowed. Workers update execution status; management verifies and closes completed tasks."},{status:409});
    }
    if(b.status==="CANCELLED"){
      if(!["SUPER_ADMIN","OPERATIONS_MANAGER"].includes(staff.profile.role))return NextResponse.json({error:"Only management can cancel tasks."},{status:403});
      const reason=typeof b.cancellation_reason==="string"?b.cancellation_reason.trim():"";
      if(reason.length<3||reason.length>1000)return NextResponse.json({error:"A cancellation reason between 3 and 1000 characters is required."},{status:400});
      if(before.status==="CANCELLED")return NextResponse.json({error:"Task is already cancelled."},{status:409});
      update.cancellation_reason=reason;
      update.cancelled_at=new Date().toISOString();
      update.cancelled_by=staff.profile.id;
    } else if(before.status==="CANCELLED") {
      return NextResponse.json({error:"Cancelled tasks cannot be reopened from this action."},{status:409});
    }
    update.status=b.status;
    if(b.status==="IN_PROGRESS"&&!before.started_at)update.started_at=new Date().toISOString();
    if(b.status==="COMPLETED"){if(!before.started_at)update.started_at=new Date().toISOString();update.completed_at=new Date().toISOString();}
  }
  if(!Object.keys(update).length)return NextResponse.json({error:"No changes supplied."},{status:400});
  const{data,error}=await s.from("operations_tasks").update(update).eq("id",b.id).select("*").single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"OPERATIONS_TASK_UPDATED",entity_type:"operations_task",entity_id:b.id,before_data:before,after_data:data});
  revalidatePath("/admin/operations");revalidatePath("/admin/staff-monitoring");
  return NextResponse.json({task:data});
}