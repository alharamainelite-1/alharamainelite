import {NextResponse} from 'next/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

const slugify=(v:string)=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'partner';
const tempPassword=()=>crypto.randomUUID().replace(/-/g,'').slice(0,18)+'Aa1!';

export async function POST(req:Request){
 const staff=await getCurrentStaff(); if(!staff||staff.profile.role!=='SUPER_ADMIN')return NextResponse.json({error:'SUPER_ADMIN access required.'},{status:403});
 try{
  const b=await req.json(); const fullName=String(b.fullName||'').trim(),email=String(b.email||'').trim().toLowerCase(),whatsapp=String(b.whatsapp||'').trim(),country=String(b.country||'').trim();
  if(fullName.length<2||!email.includes('@')||whatsapp.length<7||country.length<2)return NextResponse.json({error:'Please complete the partner details.'},{status:400});
  const s=getSupabaseAdmin(); const password=tempPassword(); const created=await s.auth.admin.createUser({email,password,email_confirm:true});
  if(created.error||!created.data.user)return NextResponse.json({error:created.error?.message||'Unable to create account.'},{status:500});
  let slug=slugify(fullName),n=1; while((await s.from('influencer_partners').select('id').eq('slug',slug).maybeSingle()).data){n++;slug=slugify(fullName)+'-'+n;}
  const {error}=await s.from('influencer_partners').insert({user_id:created.data.user.id,full_name:fullName,email,whatsapp,country,slug,status:'PENDING'});
  if(error){await s.auth.admin.deleteUser(created.data.user.id);return NextResponse.json({error:'Unable to create partner profile.'},{status:500});}
  return NextResponse.json({partner:{fullName,email,slug},temporaryPassword:password},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to add partner.'},{status:500});}
}

export async function PATCH(req:Request){
 const staff=await getCurrentStaff(); if(!staff||!['SUPER_ADMIN','ADMIN'].includes(staff.profile.role))return NextResponse.json({error:'Admin access required.'},{status:403});
 const b=await req.json().catch(()=>null) as any; if(!b?.id)return NextResponse.json({error:'Partner id is required.'},{status:400});
 const s=getSupabaseAdmin(); const {data:before}=await s.from('influencer_partners').select('*').eq('id',b.id).single(); if(!before)return NextResponse.json({error:'Partner not found.'},{status:404});
 const update:any={updated_at:new Date().toISOString()};
 if(typeof b.fullName==='string')update.full_name=b.fullName.trim();
 if(typeof b.email==='string'&&staff.profile.role==='SUPER_ADMIN')update.email=b.email.trim().toLowerCase();
 if(typeof b.whatsapp==='string')update.whatsapp=b.whatsapp.trim();
 if(typeof b.country==='string')update.country=b.country.trim();
 if(typeof b.slug==='string'&&b.slug.trim()){const slug=b.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/^-+|-+$/g,'').slice(0,48);const conflict=await s.from('influencer_partners').select('id').eq('slug',slug).neq('id',b.id).maybeSingle();if(conflict.data)return NextResponse.json({error:'That referral link is already in use.'},{status:409});update.slug=slug;}
 if(['ACTIVE','SUSPENDED','PENDING'].includes(b.status)){update.status=b.status;if(b.status==='SUSPENDED'){update.suspension_reason=String(b.suspensionReason||'Administrative decision').slice(0,500);update.suspended_at=new Date().toISOString();}else{update.suspension_reason=null;update.suspended_at=null;}}
 const {data:after,error}=await s.from('influencer_partners').update(update).eq('id',b.id).select('*').single(); if(error||!after)return NextResponse.json({error:error?.message||'Unable to update partner.'},{status:500});
 return NextResponse.json({partner:after});
}