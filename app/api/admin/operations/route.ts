import{NextResponse}from"next/server";
import{revalidatePath}from"next/cache";
import{getCurrentStaff}from"@/lib/supabase/auth";
import{getSupabaseAdmin}from"@/lib/supabase/server";

const ROLES=["SUPER_ADMIN","ADMIN","OPERATIONS_MANAGER","OPERATIONS"];
const STATUS=["PENDING","ASSIGNED","ACCEPTED","IN_PROGRESS","COMPLETED","CANCELLED"];
const TASK_TYPES=["AIRPORT_TRANSFER","AIRPORT_ASSISTANCE","HOTEL_TRANSFER","TRAIN_ASSISTANCE","MAKKAH_ZIYARAT","MADINAH_ZIYARAT","JEDDAH_EXPERIENCE","SPECIAL_ASSISTANCE","OTHER"];

export async function POST(req:Request){
  const staff=await getCurrentStaff();
  if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
  if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Operations access required."},{status:403});
  if(staff.profile.role==="OPERATIONS")return NextResponse.json({error:"Operations staff can only update assigned tasks."},{status:403});
  const b=await req.json().catch(()=>null)as any;
  if(!b?.date||!b?.task_type)return NextResponse.json({error:"Date and task type are required."},{status:400});
  if(!TASK_TYPES.includes(String(b.task_type)))return NextResponse.json({error:"Invalid task type."},{status:400});
  if(b.start_time&&b.end_time&&b.end_time<=b.start_time)return NextResponse.json({error:"End time must be after start time."},{status:400});
  const s=getSupabaseAdmin();
  if(b.assigned_host){
    const q=s.from("operations_tasks").select("id").eq("assigned_host",b.assigned_host).eq("date",b.date).neq("status","CANCELLED");
    if(b.start_time&&b.end_time)q.lt("start_time",b.end_time).gt("end_time",b.start_time);
    const {data:conflict}=await q.limit(1);
    if(conflict?.length)return NextResponse.json({error:"Host has a conflicting task at this time."},{status:409});
  }
  if(b.assigned_vehicle){
    const q=s.from("operations_tasks").select("id").eq("assigned_vehicle",b.assigned_vehicle).eq("date",b.date).neq("status","CANCELLED");
    if(b.start_time&&b.end_time)q.lt("start_time",b.end_time).gt("end_time",b.start_time);
    const {data:conflict}=await q.limit(1);
    if(conflict?.length)return NextResponse.json({error:"Vehicle has a conflicting task at this time."},{status:409});
  }
  const{data,error}=await s.from("operations_tasks").insert({
    task_id:"OT-"+Date.now().toString().slice(-8),
    group_id:b.group_id||null,
    date:b.date,
    start_time:b.start_time||null,
    end_time:b.end_time||null,
    task_type:String(b.task_type),
    assigned_host:b.assigned_host||null,
    assigned_vehicle:b.assigned_vehicle||null,
    location:b.location?String(b.location).slice(0,300):null,
    status:b.assigned_host||b.assigned_vehicle?"ASSIGNED":"PENDING",
    notes:b.notes?String(b.notes).slice(0,4000):null
  }).select("*").single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"OPERATIONS_TASK_CREATED",entity_type:"operations_task",entity_id:data.id,after_data:data});
  revalidatePath("/admin/operations");
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
  if(staff.profile.role==="OPERATIONS" && before.assigned_staff_id!==staff.profile.id)return NextResponse.json({error:"You can only update tasks assigned to you."},{status:403});
  const update:any={};
  if(b.status!==undefined){
    if(!STATUS.includes(b.status))return NextResponse.json({error:"Invalid task status."},{status:400});
    if(staff.profile.role==="OPERATIONS"){const allowed:any={PENDING:["ACCEPTED"],ASSIGNED:["ACCEPTED"],ACCEPTED:["IN_PROGRESS"],IN_PROGRESS:["COMPLETED"]};if(!(allowed[before.status]||[]).includes(b.status))return NextResponse.json({error:"Invalid task transition."},{status:403});}
    update.status=b.status;
  }
  if(!Object.keys(update).length)return NextResponse.json({error:"No changes supplied."},{status:400});
  const{data,error}=await s.from("operations_tasks").update(update).eq("id",b.id).select("*").single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"OPERATIONS_TASK_UPDATED",entity_type:"operations_task",entity_id:b.id,before_data:before,after_data:data});
  revalidatePath("/admin/operations");
  return NextResponse.json({task:data});
}