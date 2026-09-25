import{NextResponse}from"next/server";import{revalidatePath}from"next/cache";import{getCurrentStaff}from"@/lib/supabase/auth";import{getSupabaseAdmin}from"@/lib/supabase/server";
const ROLES=["SUPER_ADMIN","ADMIN","SALES"];
const STATUS=["NEW_REQUEST","CONTACTED","DETAILS_PENDING","PAYMENT_PENDING","PAYMENT_RECEIVED","CONFIRMED","PREPARING","ACTIVE","COMPLETED","CANCELLED"];
const ALLOWED:Record<string,string[]>={SALES:["CONTACTED","DETAILS_PENDING","PAYMENT_PENDING","CANCELLED"],ADMIN:[...STATUS],SUPER_ADMIN:[...STATUS]};
export async function PATCH(req:Request){
 const staff=await getCurrentStaff();if(!staff||!ROLES.includes(staff.profile.role))return NextResponse.json({error:"Sales access required."},{status:staff?403:401});
 const b=await req.json().catch(()=>null)as any;if(!b?.id||!STATUS.includes(b.status))return NextResponse.json({error:"Request and valid status are required."},{status:400});
 const allowed=ALLOWED[staff.profile.role]||[]; if(!allowed.includes(b.status))return NextResponse.json({error:"You do not have permission for this status."},{status:403});
 const s=getSupabaseAdmin();const{data:before}=await s.from("journey_requests").select("*").eq("id",b.id).single();if(!before)return NextResponse.json({error:"Request not found."},{status:404});
 const{data:booking}=await s.from("bookings").select("*").eq("request_id",b.id).maybeSingle();
 if(b.status==="CONFIRMED"&&booking&&booking.payment_status!=="RECEIVED")return NextResponse.json({error:"The booking must have a received payment before confirmation."},{status:409});
 const now=new Date().toISOString();
 const{data,error}=await s.from("journey_requests").update({status:b.status,updated_at:now}).eq("id",b.id).select("*").single();if(error)return NextResponse.json({error:error.message},{status:500});
 let syncedBooking=null;
 if(booking){
   const{data:afterBooking,error:bookingError}=await s.from("bookings").update({status:b.status,updated_at:now}).eq("id",booking.id).select("*").single();
   if(bookingError)return NextResponse.json({error:"Request saved, but booking status could not be synchronized."},{status:500});
   syncedBooking=afterBooking;
   await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"BOOKING_STATUS_SYNCED_FROM_REQUEST",entity_type:"booking",entity_id:booking.id,before_data:booking,after_data:afterBooking});
 }
 await s.from("audit_logs").insert({actor_id:staff.profile.id,action:"JOURNEY_REQUEST_STATUS_UPDATED",entity_type:"journey_request",entity_id:b.id,before_data:before,after_data:data});
 revalidatePath("/admin/requests");revalidatePath("/admin/bookings");revalidatePath("/admin");
 return NextResponse.json({request:data,booking:syncedBooking});
}