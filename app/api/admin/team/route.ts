import {NextResponse} from 'next/server';
import {getCurrentStaff,STAFF_ROLES} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

const roles=[...STAFF_ROLES];

async function requireSuperAdmin(){
  const staff=await getCurrentStaff();
  if(!staff||staff.profile.role!=='SUPER_ADMIN') return null;
  return staff;
}

const ROLE_MANAGER_ROLES:Record<string,string[]> = {
  SUPER_ADMIN:[],
  OPERATIONS_MANAGER:['SUPER_ADMIN'],
  SALES:['OPERATIONS_MANAGER'],
  MARKETING:['OPERATIONS_MANAGER'],
  CUSTOMER_SERVICE:['OPERATIONS_MANAGER'],
  OPERATIONS_SUPERVISOR:['OPERATIONS_MANAGER'],
  JOURNEY_COORDINATOR:['OPERATIONS_SUPERVISOR'],
  OPERATIONS:['OPERATIONS_SUPERVISOR'],
  HOST:['JOURNEY_COORDINATOR'],
  FINANCE:['SUPER_ADMIN']
};
const ROLE_DEPARTMENT:Record<string,string> = {
  SUPER_ADMIN:'GENERAL_MANAGEMENT', OPERATIONS_MANAGER:'OPERATIONS',
  OPERATIONS_SUPERVISOR:'OPERATIONS', JOURNEY_COORDINATOR:'OPERATIONS',
  OPERATIONS:'OPERATIONS', HOST:'OPERATIONS', SALES:'SALES',
  MARKETING:'MARKETING', CUSTOMER_SERVICE:'CUSTOMER_SERVICE', FINANCE:'FINANCE'
};
const PERMISSION_AREAS=['requests','guests','journeys','bookings','operations','groups','departures','resources','payments','finance','custody','expenses','reports','communications','reviews','influencers','team','staffMonitoring','settings','hosts','hotels','train','transportation','hostTasks'];
const PERMISSION_ACTIONS=['view','create','edit','assign','approve'];

function normalizePermissions(value:any){
  if(value===undefined||value===null)return {};
  if(typeof value!=='object'||Array.isArray(value))return null;
  const result:Record<string,Record<string,boolean>>={};
  for(const [area,actions] of Object.entries(value)){
    if(!PERMISSION_AREAS.includes(area)||!actions||typeof actions!=='object'||Array.isArray(actions))return null;
    const clean:Record<string,boolean>={};
    for(const [action,allowed] of Object.entries(actions as Record<string,unknown>)){
      if(!PERMISSION_ACTIONS.includes(action)||typeof allowed!=='boolean')return null;
      clean[action]=allowed;
    }
    result[area]=clean;
  }
  return result;
}

async function resolveManager(admin:any, role:string, requestedId:any, currentUserId?:string){
  const allowed=ROLE_MANAGER_ROLES[role];
  if(!allowed)return {managerId:null,error:'Invalid staff role.'};
  if(role==='SUPER_ADMIN'){
    if(requestedId)return {managerId:null,error:'The General Manager cannot report to another staff member.'};
    return {managerId:null,error:null};
  }
  let managerId=typeof requestedId==='string'&&requestedId.trim()?requestedId.trim():null;
  if(managerId===currentUserId)return {managerId:null,error:'An employee cannot report to themselves.'};
  if(!managerId){
    const {data,error}=await admin.from('profiles').select('id,role').in('role',allowed).limit(1);
    if(error)return {managerId:null,error:'Could not verify the direct manager.'};
    if(!data?.length)return {managerId:null,error:`Create a ${allowed.join(' or ')} account before assigning this role.`};
    managerId=data[0].id;
  }
  const {data:manager,error}=await admin.from('profiles').select('id,role').eq('id',managerId).maybeSingle();
  if(error||!manager)return {managerId:null,error:'The selected direct manager does not exist.'};
  if(!allowed.includes(String(manager.role)))return {managerId:null,error:`This role must report to: ${allowed.join(', ')}.`};
  return {managerId,error:null};
}

export async function GET(){
  const staff=await requireSuperAdmin();
  if(!staff)return NextResponse.json({error:'Forbidden'},{status:403});
  const admin=getSupabaseAdmin();
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:100});
  if(error)return NextResponse.json({error:error.message},{status:500});

  const ids=(data.users||[]).map(u=>u.id);
  const {data:partnerRows,error:partnerError}=await admin.from('influencer_partners').select('user_id').in('user_id',ids);
  if(partnerError)return NextResponse.json({error:partnerError.message},{status:500});
  const partnerIds=new Set((partnerRows||[]).map(p=>p.user_id));
  const staffIds=ids.filter(id=>!partnerIds.has(id));

  if(!staffIds.length)return NextResponse.json({users:[]});

  const [profilesResult,compResult,bonusesResult]=await Promise.all([
    admin.from('profiles').select('id,full_name,role,phone,manager_id,department,permissions,created_at,updated_at').in('id',staffIds),
    admin.from('staff_compensation').select('staff_id,base_salary,currency,pay_frequency,effective_from,notes').in('staff_id',staffIds),
    admin.from('staff_bonuses').select('id,staff_id,amount,currency,bonus_date,reason,status,approved_at,paid_at,notes').in('staff_id',staffIds).order('bonus_date',{ascending:false}).limit(500)
  ]);
  if(profilesResult.error)return NextResponse.json({error:profilesResult.error.message},{status:500});
  if(compResult.error)return NextResponse.json({error:compResult.error.message},{status:500});
  if(bonusesResult.error)return NextResponse.json({error:bonusesResult.error.message},{status:500});

  const byId=new Map((profilesResult.data||[]).map(p=>[p.id,p]));
  const byName=new Map((profilesResult.data||[]).map(p=>[p.id,p.full_name||'']));
  const compensation=new Map((compResult.data||[]).map(p=>[p.staff_id,p]));
  const bonuses=new Map<string,any[]>();
  for(const bonus of bonusesResult.data||[]){
    const list=bonuses.get(bonus.staff_id)||[];
    list.push(bonus);
    bonuses.set(bonus.staff_id,list);
  }

  return NextResponse.json({
    users:(data.users||[])
      .filter(u=>!partnerIds.has(u.id)&&byId.has(u.id))
      .map(u=>{
        const p=byId.get(u.id)!;
        return {
          id:u.id,email:u.email||'',full_name:p.full_name||'',phone:p.phone||'',role:p.role,
          manager_id:p.manager_id||null,manager_name:p.manager_id?byName.get(p.manager_id)||'':null,
          department:p.department||ROLE_DEPARTMENT[String(p.role)]||'OPERATIONS',permissions:p.permissions||{},
          created_at:p.created_at||u.created_at,email_confirmed:!!u.email_confirmed_at,banned:!!u.banned_until,
          compensation:compensation.get(u.id)||null,bonuses:bonuses.get(u.id)||[]
        };
      })
  });
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
  const manager=await resolveManager(admin,role,body?.manager_id,staff.profile.id);
  if(manager.error)return NextResponse.json({error:manager.error},{status:400});
  const permissions=normalizePermissions(body?.permissions);
  if(!permissions)return NextResponse.json({error:'Invalid permission settings.'},{status:400});
  const origin=new URL(req.url).origin;
  const {data,error}=await admin.auth.admin.inviteUserByEmail(email,{data:{full_name},redirectTo:origin+'/admin/set-password'});
  if(error)return NextResponse.json({error:error.message},{status:400});
  if(!data.user)return NextResponse.json({error:'User invitation did not return a user.'},{status:500});
  const {error:profileError}=await admin.from('profiles').upsert({id:data.user.id,full_name,phone:phone||null,role,manager_id:manager.managerId,department:ROLE_DEPARTMENT[role],permissions}, {onConflict:'id'});
  if(profileError)return NextResponse.json({error:profileError.message},{status:500});
  await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_ACCOUNT_CREATED',entity_type:'profile',entity_id:data.user.id,after_data:{id:data.user.id,email,full_name,role,manager_id:manager.managerId,department:ROLE_DEPARTMENT[role],permissions}});
  return NextResponse.json({ok:true,user:{id:data.user.id,email,full_name,role,manager_id:manager.managerId,department:ROLE_DEPARTMENT[role],permissions}});
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
  if(body?.newPassword!==undefined){
    const newPassword=String(body.newPassword||'');
    if(newPassword.length<8)return NextResponse.json({error:'Password must be at least 8 characters.'},{status:400});
    if(userId===staff.profile.id)return NextResponse.json({error:'Use your own account recovery flow to change your password.'},{status:409});
    const {data:target,error:targetError}=await admin.from('profiles').select('id,full_name,role').eq('id',userId).single();
    if(targetError||!target)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    const {data:partner}=await admin.from('influencer_partners').select('id').eq('user_id',userId).maybeSingle();
    if(partner)return NextResponse.json({error:'Partner accounts cannot be managed as staff.'},{status:409});
    const {error:passwordError}=await admin.auth.admin.updateUserById(userId,{password:newPassword});
    if(passwordError)return NextResponse.json({error:passwordError.message||'Unable to reset password.'},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_PASSWORD_RESET',entity_type:'profile',entity_id:userId,before_data:{id:target.id,full_name:target.full_name,role:target.role},after_data:{id:target.id,full_name:target.full_name,role:target.role,password_reset:true}});
    return NextResponse.json({ok:true});
  }
  if(action==='details'){
    const full_name=String(body?.full_name||'').trim();
    const email=String(body?.email||'').trim().toLowerCase();
    const phone=String(body?.phone||'').trim();
    const nextRole=String(body?.role||'');
    if(!full_name||!email.includes('@')||!roles.includes(nextRole as typeof STAFF_ROLES[number]))return NextResponse.json({error:'Name, valid email and role are required.'},{status:400});
    if(isSelf && (email!==String(staff.user.email||'').toLowerCase() || nextRole!==staff.profile.role))return NextResponse.json({error:'You can change your name and phone, but not your own email or role.'},{status:409});
    const {data:before,error:readError}=await admin.from('profiles').select('id,full_name,role,phone,manager_id,department,permissions').eq('id',userId).single();
    if(readError||!before)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    const {data:partner}=await admin.from('influencer_partners').select('id').eq('user_id',userId).maybeSingle();
    if(partner)return NextResponse.json({error:'Partner accounts cannot be managed as staff.'},{status:409});
    const requestedManager=body?.manager_id===undefined?before.manager_id:body.manager_id;
    const manager=await resolveManager(admin,nextRole,requestedManager,userId);
    if(manager.error)return NextResponse.json({error:manager.error},{status:400});
    const permissions=normalizePermissions(body?.permissions===undefined?before.permissions:body.permissions);
    if(!permissions)return NextResponse.json({error:'Invalid permission settings.'},{status:400});
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
    const {data:after,error}=await admin.from('profiles').update({full_name,phone:phone||null,role:nextRole,manager_id:manager.managerId,department:ROLE_DEPARTMENT[nextRole],permissions,updated_at:new Date().toISOString()}).eq('id',userId).select('id,full_name,role,phone,manager_id,department,permissions').single();
    if(error||!after)return NextResponse.json({error:error?.message||'Unable to update staff profile.'},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_DETAILS_UPDATED',entity_type:'profile',entity_id:userId,before_data:{...before,email:undefined},after_data:after});
    return NextResponse.json({ok:true});
  }
  if(action==='delete'){
    const {data:before,error:readError}=await admin.from('profiles').select('id,full_name,role,phone').eq('id',userId).single();
    if(readError||!before)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    const {data:partner}=await admin.from('influencer_partners').select('id').eq('user_id',userId).maybeSingle();
    if(partner)return NextResponse.json({error:'Partner accounts cannot be deleted from staff management.'},{status:409});
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
    const {data:partner}=await admin.from('influencer_partners').select('id').eq('user_id',userId).maybeSingle();
    if(partner)return NextResponse.json({error:'Partner accounts cannot be given staff roles.'},{status:409});
    const manager=await resolveManager(admin,role,body?.manager_id, userId);
    if(manager.error)return NextResponse.json({error:manager.error},{status:400});
    const {error}=await admin.from('profiles').update({role,manager_id:manager.managerId,department:ROLE_DEPARTMENT[role],updated_at:new Date().toISOString()}).eq('id',userId);
    if(error)return NextResponse.json({error:error.message},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:'STAFF_ROLE_CHANGED',entity_type:'profile',entity_id:userId,before_data:before,after_data:{...before,role}});
    return NextResponse.json({ok:true});
  }
  if(action==='active'){
    const active=body?.active===true;
    const {data:target}=await admin.from('profiles').select('id,full_name,role').eq('id',userId).maybeSingle();
    if(!target)return NextResponse.json({error:'Staff profile not found.'},{status:404});
    const {data:partner}=await admin.from('influencer_partners').select('id').eq('user_id',userId).maybeSingle();
    if(partner)return NextResponse.json({error:'Partner accounts cannot be changed from staff management.'},{status:409});
    if(!active){
      const {count}=await admin.from('profiles').select('*',{count:'exact',head:true}).eq('role','SUPER_ADMIN');
      if((count||0)<=1&&target.role==='SUPER_ADMIN')return NextResponse.json({error:'The last Super Admin cannot be deactivated.'},{status:409});
    }
    const {data:before}=await admin.from('profiles').select('id,full_name,role').eq('id',userId).single();
    const {error}=await admin.auth.admin.updateUserById(userId,{ban_duration:active?'none':'876000h'});
    if(error)return NextResponse.json({error:error.message},{status:500});
    await admin.from('audit_logs').insert({actor_id:staff.profile.id,action:active?'STAFF_ACTIVATED':'STAFF_DEACTIVATED',entity_type:'profile',entity_id:userId,before_data:before,after_data:{...before,active}});
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Unsupported action.'},{status:400});
}
