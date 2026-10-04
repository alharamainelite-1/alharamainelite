import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
const ROLES=['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER'];
const STATUS=['OPEN','CLOSED','COMPLETED'];
async function auth(){const staff=await getCurrentStaff();if(!staff)return {error:NextResponse.json({error:'Unauthorized.'},{status:401})};if(!ROLES.includes(staff.profile.role))return {error:NextResponse.json({error:'Departure management access required.'},{status:403})};return {staff};}
function validDate(v:unknown){if(typeof v!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v))return false;const d=new Date(v+'T00:00:00.000Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v&&v>=new Date().toISOString().slice(0,10);}
export async function POST(req:Request){
 const a=await auth();if(a.error)return a.error;const b=await req.json().catch(()=>null) as any;
 if(!validDate(b?.departure_date))return NextResponse.json({error:'Choose a valid future departure date.'},{status:400});
 const duration=Math.min(Math.max(Number(b.duration_nights)||9,1),30),groupSize=Math.min(Math.max(Number(b.group_size)||8,1),8),maxGroups=b.max_groups===''||b.max_groups==null?null:Math.max(Number(b.max_groups)||1,1),s=getSupabaseAdmin();
 const {data,error}=await s.from('departures').insert({departure_date:b.departure_date,duration_nights:duration,group_size:groupSize,max_groups:maxGroups,status:'OPEN',public_label:b.public_label||null,notes:b.notes||null}).select('*').single();
 if(error)return NextResponse.json({error:error.code==='23505'?'A departure already exists for this date.':error.message},{status:error.code==='23505'?409:500});
 await s.from('audit_logs').insert({actor_id:a.staff.profile.id,action:'DEPARTURE_CREATED',entity_type:'departure',entity_id:data.id,after_data:data});revalidatePath('/admin/departures');revalidatePath('/request-journey');return NextResponse.json({departure:data},{status:201});
}
export async function PATCH(req:Request){
 const a=await auth();if(a.error)return a.error;const b=await req.json().catch(()=>null) as any;if(!b?.id)return NextResponse.json({error:'Departure id is required.'},{status:400});
 const s=getSupabaseAdmin(),{data:before,error:loadError}=await s.from('departures').select('*').eq('id',b.id).maybeSingle();if(loadError)return NextResponse.json({error:'Unable to load departure.'},{status:500});if(!before)return NextResponse.json({error:'Departure not found.'},{status:404});
 const update:any={updated_at:new Date().toISOString()};
 if(b.status!==undefined){if(!STATUS.includes(b.status))return NextResponse.json({error:'Invalid departure status.'},{status:400});update.status=b.status;}
 if(b.departure_date!==undefined){if(!validDate(b.departure_date))return NextResponse.json({error:'Choose a valid future departure date.'},{status:400});if(b.departure_date!==before.departure_date){const {data:linked,error}=await s.from('bookings').select('id').eq('departure_id',b.id).limit(1);if(error)return NextResponse.json({error:'Unable to verify linked bookings.'},{status:500});if(linked?.length)return NextResponse.json({error:'This date has linked bookings. Close it and add a new date instead.'},{status:409});update.departure_date=b.departure_date;update.public_label=null;}}
 if(b.duration_nights!==undefined)update.duration_nights=Math.min(Math.max(Number(b.duration_nights)||9,1),30);
 if(b.group_size!==undefined)update.group_size=Math.min(Math.max(Number(b.group_size)||8,1),8);
 if(b.max_groups!==undefined)update.max_groups=b.max_groups===''||b.max_groups==null?null:Math.max(Number(b.max_groups)||1,1);
 if(b.public_label!==undefined)update.public_label=b.public_label||null;if(b.notes!==undefined)update.notes=b.notes||null;
 const {data,error}=await s.from('departures').update(update).eq('id',b.id).select('*').single();if(error)return NextResponse.json({error:error.code==='23505'?'A departure already exists for this date.':error.message},{status:error.code==='23505'?409:500});
 await s.from('audit_logs').insert({actor_id:a.staff.profile.id,action:'DEPARTURE_UPDATED',entity_type:'departure',entity_id:b.id,before_data:before,after_data:data});revalidatePath('/admin/departures');revalidatePath('/request-journey');return NextResponse.json({departure:data});
}
export async function DELETE(req:Request){
 const a=await auth();if(a.error)return a.error;const b=await req.json().catch(()=>null) as any;if(!b?.id)return NextResponse.json({error:'Departure id is required.'},{status:400});
 const s=getSupabaseAdmin(),{data:before,error:loadError}=await s.from('departures').select('*').eq('id',b.id).maybeSingle();if(loadError)return NextResponse.json({error:'Unable to load departure.'},{status:500});if(!before)return NextResponse.json({error:'Departure not found.'},{status:404});
 const {data:linked,error:bookingError}=await s.from('bookings').select('id').eq('departure_id',b.id).limit(1);if(bookingError)return NextResponse.json({error:'Unable to verify linked bookings.'},{status:500});if(linked?.length)return NextResponse.json({error:'This date has linked bookings and cannot be deleted. Close it instead.'},{status:409});
 const {error}=await s.from('departures').delete().eq('id',b.id);if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from('audit_logs').insert({actor_id:a.staff.profile.id,action:'DEPARTURE_DELETED',entity_type:'departure',entity_id:b.id,before_data:before});revalidatePath('/admin/departures');revalidatePath('/request-journey');return NextResponse.json({success:true});
}