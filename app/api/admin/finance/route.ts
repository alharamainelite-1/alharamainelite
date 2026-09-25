import {NextResponse} from 'next/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

const FINANCE=['SUPER_ADMIN','FINANCE','ADMIN'];
const MANAGEMENT=['SUPER_ADMIN','ADMIN'];
async function auth(){const staff=await getCurrentStaff();if(!staff||!FINANCE.includes(staff.profile.role))return null;return staff;}
async function audit(s:any,staff:any,action:string,type:string,id:string,before:any,after:any){await s.from('audit_logs').insert({actor_id:staff.profile.id,action,entity_type:type,entity_id:id,before_data:before,after_data:after});}

export async function GET(){
 const staff=await auth();if(!staff)return NextResponse.json({error:'Finance access required.'},{status:403});const s=getSupabaseAdmin();
 const [bookings,payments,costs,expenses,comp,bonuses,payroll,suppliers,catalog,profiles,groups]=await Promise.all([
  s.from('bookings').select('id,booking_id,total_amount,currency,status,payment_status,guest_count,package_id,created_at').order('created_at',{ascending:false}).limit(200),
  s.from('payments').select('id,payment_id,booking_id,amount,currency,status,date,method,reference,verified_at').order('created_at',{ascending:false}).limit(200),
  s.from('journey_costs').select('id,booking_id,group_id,category,description,amount,currency,date,supplier_id,catalog_item_id').order('date',{ascending:false}).limit(200),
  s.from('expenses').select('id,booking_id,group_id,supplier,category,amount,currency,date,reference,notes,status,created_by,approved_by').order('date',{ascending:false}).limit(200),
  s.from('staff_compensation').select('id,staff_id,base_salary,currency,pay_frequency,effective_from,notes,updated_at'),
  s.from('staff_bonuses').select('id,staff_id,amount,currency,bonus_date,reason,status,approved_at,paid_at').order('bonus_date',{ascending:false}).limit(200),
  s.from('staff_payments').select('id,staff_id,period_start,period_end,base_salary,bonus_amount,total_amount,currency,paid_date,status,reference').order('period_end',{ascending:false}).limit(200),
  s.from('finance_suppliers').select('id,name,supplier_type,contact_name,phone,email,active,notes').order('name'),
  s.from('finance_cost_catalog').select('id,name,category,supplier_id,unit,unit_cost,currency,active,notes').order('name'),
  s.from('profiles').select('id,full_name,role').order('full_name'),
  s.from('groups').select('id,group_id').order('created_at',{ascending:false}).limit(100)
 ]);
 const errors=[bookings,payments,costs,expenses,comp,bonuses,payroll,suppliers,catalog,profiles,groups].map(x=>x.error).filter(Boolean);
 if(errors.length)return NextResponse.json({error:errors[0]?.message||'Unable to load finance data.'},{status:500});
 return NextResponse.json({bookings:bookings.data||[],payments:payments.data||[],costs:costs.data||[],expenses:expenses.data||[],compensation:comp.data||[],bonuses:bonuses.data||[],payroll:payroll.data||[],suppliers:suppliers.data||[],catalog:catalog.data||[],profiles:profiles.data||[],groups:groups.data||[]});
}

export async function POST(req:Request){
 const staff=await auth();if(!staff)return NextResponse.json({error:'Finance access required.'},{status:403});
 const b=await req.json().catch(()=>null) as any;const action=String(b?.action||'');const s=getSupabaseAdmin();
 if(action==='supplier'){
  if(!MANAGEMENT.includes(staff.profile.role))return NextResponse.json({error:'Only Admin or Super Admin can change supplier records.'},{status:403});
  if(!b.name||!b.supplier_type)return NextResponse.json({error:'Supplier name and type are required.'},{status:400});
  const {data,error}=await s.from('finance_suppliers').insert({name:String(b.name).trim(),supplier_type:b.supplier_type,contact_name:b.contact_name||null,phone:b.phone||null,email:b.email||null,notes:b.notes||null}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'SUPPLIER_CREATED','finance_supplier',data.id,null,data);return NextResponse.json({data});
 }
 if(action==='catalog'){
  if(!MANAGEMENT.includes(staff.profile.role))return NextResponse.json({error:'Only Admin or Super Admin can change cost catalog.'},{status:403});
  const unitCost=Number(b.unit_cost);if(!b.name||!b.category||!Number.isFinite(unitCost)||unitCost<0)return NextResponse.json({error:'Name, category and valid unit cost are required.'},{status:400});
  const {data,error}=await s.from('finance_cost_catalog').insert({name:String(b.name).trim(),category:b.category,supplier_id:b.supplier_id||null,unit:b.unit||'SERVICE',unit_cost:unitCost,currency:b.currency||'USD',notes:b.notes||null}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'COST_CATALOG_CREATED','finance_cost_catalog',data.id,null,data);return NextResponse.json({data});
 }
 if(action==='journey_cost'){
  const amount=Number(b.amount),qty=Number(b.quantity||1);if(!b.description||!b.category||!Number.isFinite(amount)||amount<0||!Number.isFinite(qty)||qty<=0)return NextResponse.json({error:'Description, category, quantity and valid amount are required.'},{status:400});
  const {data,error}=await s.from('journey_costs').insert({booking_id:b.booking_id||null,group_id:b.group_id||null,supplier_id:b.supplier_id||null,catalog_item_id:b.catalog_item_id||null,category:b.category,description:String(b.description).slice(0,200),quantity:qty,amount,currency:b.currency||'USD',date:b.date||new Date().toISOString().slice(0,10),notes:b.notes||null,created_by:staff.profile.id}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'JOURNEY_COST_CREATED','journey_cost',data.id,null,data);return NextResponse.json({data});
 }
 if(action==='compensation'){
  if(staff.profile.role!=='SUPER_ADMIN')return NextResponse.json({error:'Only Super Admin can set base salaries.'},{status:403});
  const salary=Number(b.base_salary);if(!b.staff_id||!Number.isFinite(salary)||salary<0)return NextResponse.json({error:'Staff and valid salary are required.'},{status:400});
  const {data,error}=await s.from('staff_compensation').upsert({staff_id:b.staff_id,base_salary:salary,currency:b.currency||'USD',pay_frequency:b.pay_frequency||'MONTHLY',effective_from:b.effective_from||new Date().toISOString().slice(0,10),notes:b.notes||null,updated_by:staff.profile.id,updated_at:new Date().toISOString()},{onConflict:'staff_id'}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'STAFF_SALARY_UPDATED','staff_compensation',data.id,null,data);return NextResponse.json({data});
 }
 if(action==='bonus'){
  if(staff.profile.role!=='SUPER_ADMIN')return NextResponse.json({error:'Only Super Admin can create special bonuses.'},{status:403});
  const amount=Number(b.amount);if(!b.staff_id||!b.reason||!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:'Staff, reason and valid bonus amount are required.'},{status:400});
  const {data,error}=await s.from('staff_bonuses').insert({staff_id:b.staff_id,amount,currency:b.currency||'USD',bonus_date:b.bonus_date||new Date().toISOString().slice(0,10),reason:String(b.reason).slice(0,500),status:'APPROVED',approved_by:staff.profile.id,approved_at:new Date().toISOString(),notes:b.notes||null}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'STAFF_BONUS_CREATED','staff_bonus',data.id,null,data);return NextResponse.json({data});
 }
 if(action==='payroll'){
  const base=Number(b.base_salary||0),bonus=Number(b.bonus_amount||0);if(!b.staff_id||!b.period_start||!b.period_end||!Number.isFinite(base)||!Number.isFinite(bonus))return NextResponse.json({error:'Staff, period and valid payroll amounts are required.'},{status:400});
  const {data,error}=await s.from('staff_payments').upsert({staff_id:b.staff_id,period_start:b.period_start,period_end:b.period_end,base_salary:base,bonus_amount:bonus,total_amount:base+bonus,currency:b.currency||'USD',paid_date:b.status==='PAID'?(b.paid_date||new Date().toISOString().slice(0,10)):null,status:b.status||'PENDING',reference:b.reference||null,notes:b.notes||null,paid_by:b.status==='PAID'?staff.profile.id:null},{onConflict:'staff_id,period_start,period_end'}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'STAFF_PAYROLL_RECORDED','staff_payment',data.id,null,data);return NextResponse.json({data});
 }
 return NextResponse.json({error:'Unsupported finance action.'},{status:400});
}

export async function PATCH(req:Request){
 const staff=await auth();if(!staff)return NextResponse.json({error:'Finance access required.'},{status:403});
 const b=await req.json().catch(()=>null) as any;const action=String(b?.action||'');const id=String(b?.id||'');const s=getSupabaseAdmin();if(!id)return NextResponse.json({error:'Record id is required.'},{status:400});
 if(action==='bonus_status'){
  const status=String(b.status||'');if(!['PAID','CANCELLED'].includes(status))return NextResponse.json({error:'Invalid bonus status.'},{status:400});
  const {data:before}=await s.from('staff_bonuses').select('*').eq('id',id).single();if(!before)return NextResponse.json({error:'Bonus not found.'},{status:404});
  if(status==='PAID'&&before.status!=='APPROVED')return NextResponse.json({error:'Bonus must be approved by Super Admin before payment.'},{status:409});
  const {data,error}=await s.from('staff_bonuses').update({status,paid_at:status==='PAID'?new Date().toISOString():null}).eq('id',id).select('*').single();if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'STAFF_BONUS_STATUS_UPDATED','staff_bonus',id,before,data);return NextResponse.json({data});
 }
 if(action==='expense_status'){
  if(!['SUPER_ADMIN','FINANCE'].includes(staff.profile.role))return NextResponse.json({error:'Finance access required.'},{status:403});
  const status=String(b.status||'');if(!['APPROVED','REJECTED','PAID'].includes(status))return NextResponse.json({error:'Invalid expense status.'},{status:400});
  const {data:before}=await s.from('expenses').select('*').eq('id',id).single();if(!before)return NextResponse.json({error:'Expense not found.'},{status:404});
  if(status==='PAID'&&before.status!=='APPROVED')return NextResponse.json({error:'Expense must be approved before it is marked paid.'},{status:409});
  const {data,error}=await s.from('expenses').update({status,approved_by:status==='APPROVED'?staff.profile.id:before.approved_by,approved_at:status==='APPROVED'?new Date().toISOString():before.approved_at}).eq('id',id).select('*').single();if(error)return NextResponse.json({error:error.message},{status:500});await audit(s,staff,'EXPENSE_STATUS_UPDATED','expense',id,before,data);return NextResponse.json({data});
 }
 return NextResponse.json({error:'Unsupported finance update.'},{status:400});
}