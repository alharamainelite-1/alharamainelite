import {NextResponse} from 'next/server';
import {getCurrentStaff,STAFF_ROLES} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

const roles=[...STAFF_ROLES];

async function requireSuperAdmin(){
  const staff=await getCurrentStaff();
  if(!staff||staff.profile.role!=='SUPER_ADMIN') return null;
  return staff;
}

export async function GET(){
  const staff=await requireSuperAdmin();
  if(!staff)return NextResponse.json({error:'Forbidden'},{status:403});
  const admin=getSupabaseAdmin();
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:100});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const ids=(data.users||[]).map(u=>u.id);
  const {data:profiles,pError}=await admin.from('profiles').select('id,full_name,role,phone,created_at,updated_at').in('id',ids);
  if(pError)return NextResponse.json({error:pError.message},{status:500});
  const byId=new Map((profiles||[]).map(p=>[p.id,p]));
  return NextResponse.json({users:(data.users||[]).map(u=>{const p=byId.get(u.id);return {id:u.id,email:u.email||'',full_name:p?.full_name||u.user_metadata?.full_name||'',phone:p?.phone||'',role:p?.role||'SALES',created_at:p?.created_at||u.created_at,email_confirmed:!!u.email_confirmed_at,banned:!!u.banned_until};})});
}

export async function POST(req:Request){
  const staff=await requireSuperAdmin();
  if(!staff)return NextResponse.json({error:'Only the Super Admin can create staff accounts.'},{status:403});
  const body=await req.json().catch(()=>null);
  const email=String(body?.email||'').trim().toLowerCase();
  const full_name=String(body?.full_name||'').trim();
  const phone=String(body?.phone||'').trim();
  const role=String(body?.role||'SALES');
  if(!email||!email.includes('@')||!full_name||!roles.includes(role as typeof STAFF_ROLES[number]))return NextResponse.json({error:'Name, valid email and a valid role are required.'},{status:400});
  const admin=getSupabaseAdmin();
  const origin=new URL(req.url).origin;
  const {data,error}=await admin.auth.admin.inviteUserByEmail(email,{data:{full_name},redirectTo:origin+'/admin/set-password'});
  if(error)return NextResponse.json({error:error.message},{status:400});
  if(!data.user)return NextResponse.json({error:'User invitation did not return a user.'},{status:500});
  const {error:profileError}=await admin.from('profiles').upsert({id:data.user.id,full_name,phone:phone||null,role}, {onConflict:'id'});
  if(profileError)return NextResponse.json({error:profileError.message},{status:500});
  return NextResponse.json({ok:true,user:{id:data.user.id,email,full_name,role}});
}

export async function PATCH(req:Request){
  const staff=await requireSuperAdmin();
  if(!staff)return NextResponse.json({error:'Only the Super Admin can change staff access.'},{status:403});
  const body=await req.json().catch(()=>null);
  const userId=String(body?.userId||'');
  const action=String(body?.action||'');
  const role=body?.role?String(body.role):null;
  if(!userId)return NextResponse.json({error:'User id is required.'},{status:400});
  if(userId===staff.profile.id)return NextResponse.json({error:'You cannot change your own access from this screen.'},{status:409});
  const admin=getSupabaseAdmin();
  if(action==='role'){
    if(!role||!roles.includes(role as typeof STAFF_ROLES[number]))return NextResponse.json({error:'Invalid role.'},{status:400});
    const {error}=await admin.from('profiles').update({role,updated_at:new Date().toISOString()}).eq('id',userId);
    if(error)return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  if(action==='active'){
    const active=body?.active===true;
    if(!active){
      const {count}=await admin.from('profiles').select('*',{count:'exact',head:true}).eq('role','SUPER_ADMIN');
      if((count||0)<=1){
        const {data:u}=await admin.auth.admin.getUserById(userId);
        const profile=await admin.from('profiles').select('role').eq('id',userId).maybeSingle();
        if(profile.data?.role==='SUPER_ADMIN')return NextResponse.json({error:'The last Super Admin cannot be deactivated.'},{status:409});
      }
    }
    const {error}=await admin.auth.admin.updateUserById(userId,{ban_duration:active?'none':'876000h'});
    if(error)return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Unsupported action.'},{status:400});
}