import{NextResponse}from"next/server";
import{revalidatePath}from"next/cache";
import{getCurrentStaff}from"@/lib/supabase/auth";
import{getSupabaseAdmin}from"@/lib/supabase/server";
const ROLES=["SUPER_ADMIN","ADMIN"];
const KEYS=["group_capacity","languages","tagline","whatsapp"];
export async function PATCH(req:Request){
 const staff=await getCurrentStaff();
 if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
 if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Admin access required."},{status:403});
 const b=await req.json().catch(()=>null)as any;
 if(!b?.key||!KEYS.includes(b.key)||b.value===undefined)return NextResponse.json({error:"Invalid setting."},{status:400});
 let value:any;
 try{value=typeof b.value==="string"?JSON.parse(b.value):b.value}catch{return NextResponse.json({error:"Value must be valid JSON."},{status:400})}
 if(b.key==="group_capacity"&&(!value||Number(value.min)<1||Number(value.max)>8||Number(value.min)>Number(value.max)))return NextResponse.json({error:"Guest capacity must stay between 1 and 8."},{status:400});
 if(b.key==="languages"&&(!Array.isArray(value)||value.some((x:any)=>!["en","so","ar"].includes(x))))return NextResponse.json({error:"Languages must use en, so and ar."},{status:400});
 if((b.key==="tagline"||b.key==="whatsapp")&&(typeof value!=="string"||value.length>200))return NextResponse.json({error:"Invalid setting value."},{status:400});
 const s=getSupabaseAdmin();
 const{data:before}=await s.from("site_settings").select("*").eq("key",b.key).maybeSingle();
 const{data,error}=await s.from("site_settings").upsert({key:b.key,value,updated_at:new Date().toISOString()},{onConflict:"key"}).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"SITE_SETTING_UPDATED",entity_type:"site_setting",entity_id:null,before_data:before,after_data:data});
 revalidatePath("/admin/settings"); revalidatePath("/");
 return NextResponse.json({setting:data});
}