import {NextResponse} from 'next/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

export async function POST(req:Request){
 const staff=await getCurrentStaff();
 if(!staff)return NextResponse.json({error:'Unauthorized.'},{status:401});
 const body=await req.json().catch(()=>null) as any;
 const event=body?.event;
 if(!['LOGIN','LOGOUT'].includes(event))return NextResponse.json({error:'Invalid activity event.'},{status:400});
 const s=getSupabaseAdmin();
 const {error}=await s.from('staff_activity').insert({staff_id:staff.profile.id,event_type:event,metadata:{source:'admin'}});
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({ok:true});
}
