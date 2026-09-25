import{NextResponse}from"next/server";
import{revalidatePath}from"next/cache";
import{getCurrentStaff}from"@/lib/supabase/auth";
import{getSupabaseAdmin}from"@/lib/supabase/server";
const ROLES=["SUPER_ADMIN","ADMIN"];
const STATUS=["DRAFT","PUBLISHED"];
export async function PATCH(req:Request){
 const staff=await getCurrentStaff();
 if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
 if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Sales access required."},{status:403});
 const b=await req.json().catch(()=>null)as any;
 if(!b?.id||!STATUS.includes(b.status)||typeof b.verified!=="boolean")return NextResponse.json({error:"Invalid review update."},{status:400});
 
 const s=getSupabaseAdmin();
 const{data:before}=await s.from("reviews").select("*").eq("id",b.id).single();
 if(!before)return NextResponse.json({error:"Review not found."},{status:404});
 const{data,error}=await s.from("reviews").update({status:b.status,verified:b.verified}).eq("id",b.id).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"REVIEW_MODERATED",entity_type:"review",entity_id:b.id,before_data:before,after_data:data});
 revalidatePath("/admin/reviews"); revalidatePath("/reviews");
 return NextResponse.json({review:data});
}