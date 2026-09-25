import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

const ACCESS=['SUPER_ADMIN','ADMIN','FINANCE'];
const MANAGE=['SUPER_ADMIN','FINANCE'];
const CATEGORIES=['CASH','DEVICE','KEY','DOCUMENT','CARD','ASSET','OTHER'];
const STATUSES=['ACTIVE','RETURNED','SETTLED','LOST','CANCELLED'];

async function auth(){
 const staff=await getCurrentStaff();
 if(!staff||!ACCESS.includes(staff.profile.role))return null;
 return staff;
}
async function audit(s:any,staff:any,action:string,id:string,before:any,after:any){
 await s.from('audit_logs').insert({actor_id:staff.profile.id,action,entity_type:'custody_item',entity_id:id,before_data:before,after_data:after});
}

export async function GET(){
 const staff=await auth();if(!staff)return NextResponse.json({error:'Custody access required.'},{status:403});
 const s=getSupabaseAdmin();
 const [items,profiles]=await Promise.all([
  s.from('custody_items').select('*').order('status').order('issued_date',{ascending:false}),
  s.from('profiles').select('id,full_name,role').order('full_name')
 ]);
 if(items.error||profiles.error)return NextResponse.json({error:(items.error||profiles.error)?.message||'Unable to load custody.'},{status:500});
 return NextResponse.json({items:items.data||[],profiles:profiles.data||[]});
}

export async function POST(req:Request){
 const staff=await auth();if(!staff||!MANAGE.includes(staff.profile.role))return NextResponse.json({error:'Only Finance or Super Admin can manage custody.'},{status:403});
 const b=await req.json().catch(()=>null) as any;
 const type=String(b?.custody_type||'');const category=String(b?.custody_category||'');const value=Number(b?.value||0);const qty=Number(b?.quantity||1);
 if(!['EMPLOYEE','FINANCE'].includes(type)||!b?.title||!CATEGORIES.includes(category)||!Number.isFinite(value)||value<0||!Number.isFinite(qty)||qty<=0)return NextResponse.json({error:'Type, title, category, quantity and valid value are required.'},{status:400});
 if(type==='EMPLOYEE'&&!b.assignee_staff_id)return NextResponse.json({error:'Employee custody must be assigned to an employee.'},{status:400});
 const {data,error}=await getSupabaseAdmin().from('custody_items').insert({
  custody_type:type,assignee_staff_id:b.assignee_staff_id||null,title:String(b.title).trim().slice(0,200),custody_category:category,
  description:b.description||null,serial_number:b.serial_number||null,quantity:qty,value,currency:b.currency||'SAR',
  issued_date:b.issued_date||new Date().toISOString().slice(0,10),expected_return_date:b.expected_return_date||null,
  status:'ACTIVE',reference:b.reference||null,notes:b.notes||null,issued_by:staff.profile.id
 }).select('*').single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await audit(getSupabaseAdmin(),staff,'CUSTODY_CREATED',data.id,null,data);
 revalidatePath('/admin/custody');revalidatePath('/admin/finance');
 return NextResponse.json({data},{status:201});
}

export async function PATCH(req:Request){
 const staff=await auth();if(!staff||!MANAGE.includes(staff.profile.role))return NextResponse.json({error:'Only Finance or Super Admin can manage custody.'},{status:403});
 const b=await req.json().catch(()=>null) as any;const id=String(b?.id||'');const status=String(b?.status||'');
 if(!id||!STATUSES.includes(status))return NextResponse.json({error:'Record and valid status are required.'},{status:400});
 const s=getSupabaseAdmin();const {data:before}=await s.from('custody_items').select('*').eq('id',id).single();
 if(!before)return NextResponse.json({error:'Custody record not found.'},{status:404});
 const now=new Date().toISOString().slice(0,10);
 const patch:any={status,updated_at:new Date().toISOString()};
 if(status==='RETURNED')patch.returned_date=b.returned_date||now,patch.returned_to=staff.profile.id;
 if(status==='SETTLED')patch.settled_date=b.settled_date||now;
 const {data,error}=await s.from('custody_items').update(patch).eq('id',id).select('*').single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 await audit(s,staff,'CUSTODY_STATUS_UPDATED',id,before,data);
 revalidatePath('/admin/custody');revalidatePath('/admin/finance');
 return NextResponse.json({data});
}