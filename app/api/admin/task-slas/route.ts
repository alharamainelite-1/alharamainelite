import{NextResponse}from"next/server";
import{revalidatePath}from"next/cache";
import{getCurrentStaff}from"@/lib/supabase/auth";
import{getSupabaseAdmin}from"@/lib/supabase/server";

const MANAGERS=["SUPER_ADMIN","ADMIN","OPERATIONS_MANAGER"];
const TASK_TYPES=["AIRPORT_TRANSFER","AIRPORT_ASSISTANCE","HOTEL_TRANSFER","TRAIN_ASSISTANCE","MAKKAH_ZIYARAT","MADINAH_ZIYARAT","JEDDAH_EXPERIENCE","SPECIAL_ASSISTANCE","OTHER"];

export async function PATCH(req:Request){
 const staff=await getCurrentStaff();
 if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
 if(!MANAGERS.includes(staff.profile.role))return NextResponse.json({error:"Management access required."},{status:403});
 const b=await req.json().catch(()=>null)as any;
 if(!b?.task_type||!TASK_TYPES.includes(String(b.task_type)))return NextResponse.json({error:"Invalid task type."},{status:400});
 const target=Number(b.target_minutes),warning=Number(b.warning_minutes);
 if(!Number.isInteger(target)||target<5||target>10080)return NextResponse.json({error:"Target must be between 5 minutes and 7 days."},{status:400});
 if(!Number.isInteger(warning)||warning<0||warning>=target)return NextResponse.json({error:"Warning must be non-negative and less than target."},{status:400});
 const active=b.active!==false;
 const s=getSupabaseAdmin();
 const{data:before}=await s.from("operations_task_slas").select("*").eq("task_type",String(b.task_type)).maybeSingle();
 const{data,error}=await s.from("operations_task_slas").upsert({task_type:String(b.task_type),target_minutes:target,warning_minutes:warning,active,updated_at:new Date().toISOString()},{onConflict:"task_type"}).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"TASK_SLA_UPDATED",entity_type:"operations_task_sla",entity_id:data.id,before_data:before,after_data:data});
 revalidatePath("/admin/settings");revalidatePath("/admin/staff-monitoring");
 return NextResponse.json({sla:data});
}