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
  const {data:profiles,error:profileError}=await admin.from('profiles').select('id,full_name,role,phone,created_at,updated_at').in('id',ids);
  if(profileError)return NextResponse.json({error:profileError.message},{status:500});
  const byId=new Map((profiles||[]).map(p=>[p.id,p]));
  // Only profiles are staff records. Partner/customer auth users must not appear in Team.
  return NextResponse.json({users:(data.users||[]).filter(u=>byId.has(u.id)).map(u=>{const p=byId.get(u.id)!;return {id:u.id,email:u.email||'',full_name:p.full_name||'',phone:p.phone||'',role:p.role,created_at:p.created_at||u.created_at,email_confirmed:!!u.email_confirmed_at,banned:!!u.banned_until};})});
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
  const isSelf=userId===staff.profile.id;
  const admin=getSupabaseAdmin();
  if(isSelf && action==='delete')return NextResponse.json({error:'You cannot delete your own account.'},{status:409});
  if(isSelf && action==='role')return NextResponse.json({error:'You cannot change your own role.'},{status:409});
  if(isSelf && action==='active' && body?.active!==true)return NextResponse.json({error:'You cannot deactivate your own account.'},{status:409});
  if(action==='details'){
    const full_name=String(body?.full_name||'').trim();
    const email=String(body?.email||'').trim().toLowerCase();
    const phone=String(body?.phone||'').trim();
    const nextRole=String(body?.role||'');
    if(!full_name||!email.includes('@')||!roles.includes(nextRole as typeof STAFF_ROLES[number]))return NextResponse.json({error:'Name, valid email and role are required.'},{status:400});
    if(isSelf && (email!==String(staff.user.email||'').toLowerCase() || nextRole!==staff.profile.role))return NextResponse.json({error:'You can change your name and phone, but not your own email or role.'},{status:409});
    const {data:before,error:readError}=await admin.from('profiles').select('id,full_name,role,phone').eq('id',userId).single();
    if(readError||!before)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    if(isSelf){
      const {data:after,error}=await admin.from('profiles').update({full_name,phone:phone||null,updated_at:new Date().toISOString()}).eq('id',userId).select('id,full_name,role,phone').single();
      if(error||!after)return NextResponse.json({error:error?.message||'Unable to update your staff profile.'},{status:500});
      const authUpdate=await admin.auth.admin.updateUserById(userId,{user_metadata:{full_name}});
      if(authUpdate.error)return NextResponse.json({error:authUpdate.error.message},{status:400});
      await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_DETAILS_UPDATED',entity_type:'profile',entity_id:userId,before_data:{...before,email:undefined},after_data:after});
      return NextResponse.json({ok:true});
    }
    const authUpdate=await admin.auth.admin.updateUserById(userId,{email,user_metadata:{full_name}});
    if(authUpdate.error)return NextResponse.json({error:authUpdate.error.message},{status:400});
    const {data:after,error}=await admin.from('profiles').update({full_name,phone:phone||null,role:nextRole,updated_at:new Date().toISOString()}).eq('id',userId).select('id,full_name,role,phone').single();
    if(error||!after)return NextResponse.json({error:error?.message||'Unable to update staff profile.'},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_DETAILS_UPDATED',entity_type:'profile',entity_id:userId,before_data:{...before,email:undefined},after_data:after});
    return NextResponse.json({ok:true});
  }
  if(action==='delete'){
    const {data:before,error:readError}=await admin.from('profiles').select('id,full_name,role,phone').eq('id',userId).single();
    if(readError||!before)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    if(before.role==='SUPER_ADMIN'){
      const {count}=await admin.from('profiles').select('*',{count:'exact',head:true}).eq('role','SUPER_ADMIN');
      if((count||0)<=1)return NextResponse.json({error:'The last Super Admin cannot be deleted.'},{status:409});
    }
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_ACCOUNT_DELETED',entity_type:'profile',entity_id:userId,before_data:before,after_data:null});
    const {error}=await admin.auth.admin.deleteUser(userId);
    if(error)return NextResponse.json({error:error.message},{status:500});
    await admin.from('profiles').delete().eq('id',userId);
    return NextResponse.json({ok:true});
  }
  if(action==='role'){
    if(!role||!roles.includes(role as typeof STAFF_ROLES[number]))return NextResponse.json({error:'Invalid role.'},{status:400});
    const {data:before,error:readError}=await admin.from('profiles').select('id,full_name,role').eq('id',userId).single();
    if(readError||!before)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    const {error}=await admin.from('profiles').update({role,updated_at:new Date().toISOString()}).eq('id',userId);
    if(error)return NextResponse.json({error:error.message},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_ROLE_CHANGED',entity_type:'profile',entity_id:userId,before_data:before,after_data:{...before,role}});
    return NextResponse.json({ok:true});
  }
  if(action==='active'){
    const active=body?.active===true;
    if(!active){
      const {count}=await admin.from('profiles').select('*',{count:'exact',head:true}).eq('role','SUPER_ADMIN');
      if((count||0)<=1){
        const profile=await admin.from('profiles').select('role').eq('id',userId).maybeSingle();
        if(profile.data?.role==='SUPER_ADMIN')return NextResponse.json({error:'The last Super Admin cannot be deactivated.'},{status:409});
      }
    }
    const {data:before}=await admin.from('profiles').select('id,full_name,role').eq('id',userId).single();
    const {error}=await admin.auth.admin.updateUserById(userId,{ban_duration:active?'none':'876000h'});
    if(error)return NextResponse.json({error:error.message},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:active?'STAFF_ACTIVATED':'STAFF_DEACTIVATED',entity_type:'profile',entity_id:userId,before_data:before,after_data:{...before,active}});
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Unsupported action.'},{status:400});
}