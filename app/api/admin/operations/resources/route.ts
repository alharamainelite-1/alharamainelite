import{NextResponse}from"next/server";import{revalidatePath}from"next/cache";import{getCurrentStaff}from"@/lib/supabase/auth";import{getSupabaseAdmin}from"@/lib/supabase/server";
const ROLES=["SUPER_ADMIN","ADMIN","OPERATIONS_MANAGER","OPERATIONS"];
export async function PATCH(req:Request){
 const staff=await getCurrentStaff();if(!staff||!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Operations access required."},{status:staff?403:401});
 const b=await req.json().catch(()=>null)as any;if(staff.profile.role==="OPERATIONS")return NextResponse.json({error:"Only Operations Management can assign resources."},{status:403});if(!b?.id)return NextResponse.json({error:"Task id is required."},{status:400});
 const s=getSupabaseAdmin();const{data:before}=await s.from("operations_tasks").select("*").eq("id",b.id).single();if(!before)return NextResponse.json({error:"Task not found."},{status:404});
 const update:any={};if(b.assigned_host!==undefined)update.assigned_host=b.assigned_host||null;if(b.assigned_vehicle!==undefined)update.assigned_vehicle=b.assigned_vehicle||null;if(b.assigned_staff_id!==undefined)update.assigned_staff_id=b.assigned_staff_id||null;if(Object.keys(update).length===0)return NextResponse.json({error:"No assignment supplied."},{status:400});
 if(["COMPLETED","CANCELLED"].includes(String(before.status)))return NextResponse.json({error:"Completed or cancelled tasks cannot be reassigned."},{status:409});
 if(update.assigned_staff_id){
  const{data:assignedStaff}=await s.from("profiles").select("id,role").eq("id",update.assigned_staff_id).maybeSingle();
  if(!assignedStaff)return NextResponse.json({error:"Assigned staff member was not found."},{status:404});
  if(!["OPERATIONS_MANAGER","OPERATIONS"].includes(String(assignedStaff.role)))return NextResponse.json({error:"Only Operations Manager or Operations staff can be assigned to an operations task."},{status:400});
 }
 if(update.assigned_host){
  const{data:host}=await s.from("hosts").select("id,status").eq("id",update.assigned_host).maybeSingle();
  if(!host)return NextResponse.json({error:"Assigned host was not found."},{status:404});
  if(["OFF_DUTY","UNAVAILABLE"].includes(String(host.status)))return NextResponse.json({error:"The selected host is not available."},{status:409});
 }
 if(update.assigned_vehicle){
  const{data:vehicle}=await s.from("vehicles").select("id,status").eq("id",update.assigned_vehicle).maybeSingle();
  if(!vehicle)return NextResponse.json({error:"Assigned vehicle was not found."},{status:404});
  if(["INACTIVE","UNAVAILABLE","OUT_OF_SERVICE"].includes(String(vehicle.status)))return NextResponse.json({error:"The selected vehicle is not available."},{status:409});
 }
 const date=before.date,start=before.start_time,end=before.end_time;
 const nextHost=update.assigned_host!==undefined?update.assigned_host:before.assigned_host;
 const nextVehicle=update.assigned_vehicle!==undefined?update.assigned_vehicle:before.assigned_vehicle;
 const nextStaff=update.assigned_staff_id!==undefined?update.assigned_staff_id:before.assigned_staff_id;
 if(before.status==="PENDING"&&(nextHost||nextVehicle||nextStaff))update.status="ASSIGNED";
 else if(before.status==="ASSIGNED"&&!nextHost&&!nextVehicle&&!nextStaff)update.status="PENDING";
 if(start&&end&&b.assigned_host){const{data:conflict}=await s.from("operations_tasks").select("id").eq("assigned_host",b.assigned_host).eq("date",date).neq("id",b.id).neq("status","CANCELLED").lt("start_time",end).gt("end_time",start).limit(1);if(conflict?.length)return NextResponse.json({error:"Host has a conflicting task at this time."},{status:409});}
 if(start&&end&&b.assigned_vehicle){const{data:conflict}=await s.from("operations_tasks").select("id").eq("assigned_vehicle",b.assigned_vehicle).eq("date",date).neq("id",b.id).neq("status","CANCELLED").lt("start_time",end).gt("end_time",start).limit(1);if(conflict?.length)return NextResponse.json({error:"Vehicle has a conflicting task at this time."},{status:409});}
 const{data,error}=await s.from("operations_tasks").update(update).eq("id",b.id).select("*").single();if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"OPERATIONS_ASSIGNMENT_UPDATED",entity_type:"operations_task",entity_id:b.id,before_data:before,after_data:data});revalidatePath("/admin/operations");return NextResponse.json({task:data});
}