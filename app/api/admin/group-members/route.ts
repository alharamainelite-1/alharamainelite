import{NextResponse}from"next/server";
import{revalidatePath}from"next/cache";
import{getCurrentStaff}from"@/lib/supabase/auth";
import{getSupabaseAdmin}from"@/lib/supabase/server";
const ROLES=["SUPER_ADMIN","ADMIN","OPERATIONS_MANAGER"];
export async function POST(req:Request){
 const staff=await getCurrentStaff(); if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
 if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Operations manager access required."},{status:403});
 const b=await req.json().catch(()=>null)as any;
 if(!b?.group_id||!b?.booking_id)return NextResponse.json({error:"Group and booking are required."},{status:400});
 const s=getSupabaseAdmin();
 const[{data:g},{data:booking},{data:existing}]=await Promise.all([
  s.from("groups").select("id,capacity").eq("id",b.group_id).single(),
  s.from("bookings").select("id,guest_count,status").eq("id",b.booking_id).single(),
  s.from("group_members").select("id,group_id,guest_count").eq("booking_id",b.booking_id)
 ]);
 if(!g)return NextResponse.json({error:"Group not found."},{status:404});
 if(!booking)return NextResponse.json({error:"Booking not found."},{status:404});
 if(["CANCELLED","COMPLETED"].includes(booking.status))return NextResponse.json({error:"This booking cannot be added to a group."},{status:409});
 if(existing?.length)return NextResponse.json({error:"This booking is already assigned to a group."},{status:409});
 const{data:members}=await s.from("group_members").select("guest_count").eq("group_id",b.group_id);
 const used=(members||[]).reduce((n:any,x:any)=>n+Number(x.guest_count||0),0);
 const guestCount=Number(booking.guest_count||0);
 if(used+guestCount>g.capacity)return NextResponse.json({error:`Group capacity exceeded. Available: ${Math.max(g.capacity-used,0)} guests.`},{status:409});
 const{data,error}=await s.from("group_members").insert({group_id:b.group_id,booking_id:b.booking_id,guest_count:guestCount,approved_by:staff.profile.id,approved_at:new Date().toISOString()}).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"BOOKING_ADDED_TO_GROUP",entity_type:"group_member",entity_id:data.id,after_data:data});
 revalidatePath("/admin/groups"); return NextResponse.json({member:data},{status:201});
}
export async function DELETE(req:Request){
 const staff=await getCurrentStaff(); if(!staff)return NextResponse.json({error:"Unauthorized."},{status:401});
 if(!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Operations manager access required."},{status:403});
 const b=await req.json().catch(()=>null)as any; if(!b?.id)return NextResponse.json({error:"Membership id is required."},{status:400});
 const s=getSupabaseAdmin(); const{data:before}=await s.from("group_members").select("*").eq("id",b.id).single();
 if(!before)return NextResponse.json({error:"Membership not found."},{status:404});
 const{error}=await s.from("group_members").delete().eq("id",b.id); if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"BOOKING_REMOVED_FROM_GROUP",entity_type:"group_member",entity_id:b.id,before_data:before});
 revalidatePath("/admin/groups"); return NextResponse.json({ok:true});
}