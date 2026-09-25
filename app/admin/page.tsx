import Link from "next/link";
import {getSupabaseAdmin} from "@/lib/supabase/server";
import {getCurrentStaff} from "@/lib/supabase/auth";
import {getAdminLocale} from "@/lib/admin-locale";
import {adminText} from "@/lib/admin-text";

const roleConfig:any={
 SALES:{en:{eyebrow:"SALES WORKSPACE",title:"Sales",intro:"Your workspace is focused on new leads, customer conversations and moving qualified requests forward.",primary:"Open Requests",href:"/admin/requests"},ar:{eyebrow:"مساحة المبيعات",title:"المبيعات",intro:"مساحتك مخصصة للطلبات الجديدة والتواصل مع العملاء ونقل الطلبات المؤهلة إلى المرحلة التالية.",primary:"فتح الطلبات",href:"/admin/requests"}},
 FINANCE:{en:{eyebrow:"FINANCE WORKSPACE",title:"Finance",intro:"Your workspace is focused on payment verification, expenses and financial reporting.",primary:"Open Payments",href:"/admin/payments"},ar:{eyebrow:"المساحة المالية",title:"المالية",intro:"مساحتك مخصصة للتحقق من المدفوعات والمصروفات والتقارير المالية.",primary:"فتح المدفوعات",href:"/admin/payments"}},
 OPERATIONS_MANAGER:{en:{eyebrow:"OPERATIONS MANAGEMENT",title:"Operations Manager",intro:"Your workspace is focused on groups, resources, hosts and keeping every journey operationally ready.",primary:"Open Operations",href:"/admin/operations"},ar:{eyebrow:"إدارة العمليات",title:"مدير العمليات",intro:"مساحتك مخصصة للمجموعات والموارد والمضيفين وجاهزية الرحلات التشغيلية.",primary:"فتح العمليات",href:"/admin/operations"}},
 OPERATIONS:{en:{eyebrow:"OPERATIONS WORKSPACE",title:"Operations",intro:"Your workspace is focused on assigned operational work, schedules, resources and task completion.",primary:"Open My Operations",href:"/admin/operations"},ar:{eyebrow:"مساحة العمليات",title:"العمليات",intro:"مساحتك مخصصة للمهام التشغيلية والجدولة والموارد وإنجاز المهام المسندة.",primary:"فتح العمليات",href:"/admin/operations"}},
 ADMIN:{en:{eyebrow:"MANAGEMENT WORKSPACE",title:"Administration",intro:"Manage customers, journeys and operational coordination. Financial workspaces are intentionally separated.",primary:"Open Journeys",href:"/admin/journeys"},ar:{eyebrow:"مساحة الإدارة",title:"الإدارة",intro:"إدارة العملاء والرحلات والتنسيق التشغيلي. تم فصل المساحات المالية عن الإدارة.",primary:"فتح الرحلات",href:"/admin/journeys"}},
 SUPER_ADMIN:{en:{eyebrow:"EXECUTIVE CONTROL",title:"Super Admin",intro:"Full control of the platform, team permissions, security and business operations.",primary:"Open Team",href:"/admin/team"},ar:{eyebrow:"الإدارة العليا",title:"المدير الأعلى",intro:"تحكم كامل في المنصة والفريق والصلاحيات والأمان والعمليات.",primary:"فتح الفريق",href:"/admin/team"}}
};

function Stat({label,value,href}:{label:string;value:number|string;href?:string}) {
 const body=<div className="card p-6"><div className="eyebrow">{label}</div><div className="serif mt-2 text-4xl text-forest">{value}</div></div>;
 return href?<Link href={href} className="block hover:border-gold/50">{body}</Link>:body;
}

async function SalesDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin();
 const [requests,contacted,pending,customers]=await Promise.all([
  s.from("journey_requests").select("*",{count:"exact",head:true}).eq("status","NEW_REQUEST"),
  s.from("journey_requests").select("*",{count:"exact",head:true}).in("status",["CONTACTED","DETAILS_PENDING"]),
  s.from("journey_requests").select("*",{count:"exact",head:true}).eq("status","PAYMENT_PENDING"),
  s.from("customers").select("*",{count:"exact",head:true})
 ]);
 return <RoleShell cfg={roleConfig.SALES[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <Stat label={locale==='ar'?'طلبات جديدة':'NEW REQUESTS'} value={requests.count||0} href="/admin/requests"/><Stat label={locale==='ar'?'متابعة مطلوبة':'FOLLOW-UP'} value={contacted.count||0} href="/admin/requests"/><Stat label={locale==='ar'?'بانتظار الدفع':'PAYMENT PENDING'} value={pending.count||0} href="/admin/requests"/><Stat label={locale==='ar'?'العملاء':'CUSTOMERS'} value={customers.count||0} href="/admin/guests"/>
 </div><WorkspaceSteps items={locale==='ar'?["استلام الطلب","التواصل مع العميل","استكمال التفاصيل","تحويل الطلب للمالية"]:["Receive request","Contact customer","Complete details","Hand off to Finance"]} links={["/admin/requests","/admin/requests","/admin/requests","/admin/requests"]}/></RoleShell>
}

async function FinanceDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin();
 const [pending,received,expenses]=await Promise.all([
  s.from("payments").select("*",{count:"exact",head:true}).in("status",["PENDING","PENDING_VERIFICATION","PAYMENT_INSTRUCTIONS_SENT"]),
  s.from("payments").select("amount,status").eq("status","RECEIVED"),
  s.from("expenses").select("*",{count:"exact",head:true})
 ]);
 const revenue=((received.data||[]) as any[]).reduce((n,x)=>n+Number(x.amount||0),0);
 return <RoleShell cfg={roleConfig.FINANCE[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Stat label={locale==='ar'?'إجراءات الدفع':'PAYMENT ACTIONS'} value={pending.count||0} href="/admin/payments"/><Stat label={locale==='ar'?'المبالغ المستلمة':'RECEIVED'} value={'USD '+revenue.toLocaleString()} href="/admin/payments"/><Stat label={locale==='ar'?'المصروفات':'EXPENSES'} value={expenses.count||0} href="/admin/expenses"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة التحويل","مطابقة الحجز","تأكيد الاستلام","تحديث السجلات"]:["Review transfer","Match booking","Confirm receipt","Update records"]} links={["/admin/payments","/admin/payments","/admin/payments","/admin/reports"]}/></RoleShell>
}

async function OperationsManagerDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin();
 const [tasks,groups,hosts,vehicles]=await Promise.all([
  s.from("operations_tasks").select("*",{count:"exact",head:true}).neq("status","COMPLETED").neq("status","CANCELLED"),
  s.from("groups").select("*",{count:"exact",head:true}),
  s.from("hosts").select("*",{count:"exact",head:true}).in("status",["AVAILABLE","ASSIGNED"]),
  s.from("vehicles").select("*",{count:"exact",head:true}).in("status",["AVAILABLE","ASSIGNED"])
 ]);
 return <RoleShell cfg={roleConfig.OPERATIONS_MANAGER[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label={locale==='ar'?'المهام المفتوحة':'OPEN TASKS'} value={tasks.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'المجموعات':'GROUPS'} value={groups.count||0} href="/admin/groups"/><Stat label={locale==='ar'?'المضيفون':'HOSTS'} value={hosts.count||0} href="/admin/hosts"/><Stat label={locale==='ar'?'المركبات':'VEHICLES'} value={vehicles.count||0} href="/admin/transportation"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة الرحلات المؤكدة","بناء المجموعات","توزيع الموارد","متابعة الجاهزية"]:["Review confirmed journeys","Build groups","Assign resources","Monitor readiness"]} links={["/admin/journeys","/admin/groups","/admin/operations","/admin/operations"]}/></RoleShell>
}

async function OperationsDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin();
 const [open,accepted,today]=await Promise.all([
  s.from("operations_tasks").select("*",{count:"exact",head:true}).not("status","in","(COMPLETED,CANCELLED)"),
  s.from("operations_tasks").select("*",{count:"exact",head:true}).eq("status","ACCEPTED"),
  s.from("operations_tasks").select("*",{count:"exact",head:true}).eq("date",new Date().toISOString().slice(0,10))
 ]);
 return <RoleShell cfg={roleConfig.OPERATIONS[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Stat label={locale==='ar'?'المهام المفتوحة':'OPEN TASKS'} value={open.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'مقبولة':'ACCEPTED'} value={accepted.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'مهام اليوم':'TODAY'} value={today.count||0} href="/admin/operations"/></div><WorkspaceSteps items={locale==='ar'?["راجع جدولك","نفذ المهمة","حدّث الحالة","أبلغ عن أي تعارض"]:["Review schedule","Execute task","Update status","Report conflicts"]} links={["/admin/operations","/admin/operations","/admin/operations","/admin/operations"]}/></RoleShell>
}

async function ManagementDashboard({locale,superAdmin=false}:{locale:'en'|'ar';superAdmin?:boolean}){
 const s=getSupabaseAdmin();
 const [requests,journeys,tasks,completed]=await Promise.all([
  s.from("journey_requests").select("*",{count:"exact",head:true}).in("status",["NEW_REQUEST","CONTACTED","DETAILS_PENDING"]),
  s.from("bookings").select("*",{count:"exact",head:true}).in("status",["CONFIRMED","PREPARING","ACTIVE"]),
  s.from("operations_tasks").select("*",{count:"exact",head:true}).not("status","in","(COMPLETED,CANCELLED)"),
  s.from("bookings").select("*",{count:"exact",head:true}).eq("status","COMPLETED")
 ]);
 const cfg=superAdmin?roleConfig.SUPER_ADMIN[locale]:roleConfig.ADMIN[locale];
 return <RoleShell cfg={cfg}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label={locale==='ar'?'طلبات تحتاج متابعة':'REQUESTS TO REVIEW'} value={requests.count||0} href="/admin/requests"/><Stat label={locale==='ar'?'رحلات نشطة':'ACTIVE JOURNEYS'} value={journeys.count||0} href="/admin/journeys"/><Stat label={locale==='ar'?'مهام تشغيلية':'OPEN OPERATIONS'} value={tasks.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'رحلات مكتملة':'COMPLETED'} value={completed.count||0} href="/admin/journeys"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة الطلبات","متابعة الرحلات","متابعة التشغيل","مراجعة الأداء"]:["Review requests","Monitor journeys","Monitor operations","Review performance"]} links={["/admin/requests","/admin/journeys","/admin/operations","/admin/reports"]}/></RoleShell>
}

function RoleShell({cfg,children}:{cfg:any;children:React.ReactNode}){
 return <section className="pb-12"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">{cfg.eyebrow}</div><h1 className="serif mt-2 text-4xl xl:text-5xl text-forest">{cfg.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-forest/55">{cfg.intro}</p></div><Link href={cfg.href} className="btn btn-primary">{cfg.primary}</Link></div><div className="mt-8">{children}</div></section>
}

function WorkspaceSteps({items,links}:{items:string[];links:string[]}){
 return <div className="mt-8 card p-6"><div className="eyebrow">سير العمل</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item,i)=><Link key={item} href={links[i]} className="rounded-xl bg-[#f7f3ea] p-5 hover:bg-white"><div className="text-xs font-bold text-gold">{i+1}</div><div className="mt-2 font-semibold text-forest">{item}</div></Link>)}</div></div>
}

export default async function AdminHome(){
 const staff=await getCurrentStaff(); if(!staff)return null;
 const locale=await getAdminLocale(); const role=staff.profile.role as keyof typeof roleConfig;
 if(role==='HOST'){
  const s=getSupabaseAdmin();
  const {data:host}=await s.from('hosts').select('id,name').eq('user_id',staff.profile.id).maybeSingle();
  const {data:tasks}=host?await s.from('host_tasks').select('id,task_id,date,start_time,end_time,location,task_type,status').eq('host_id',host.id).order('date',{ascending:true}).order('start_time',{ascending:true}).limit(50):{data:[]};
  return <section className="pb-12"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">{locale==='ar'?'مساحة المضيف':'HOST WORKSPACE'}</div><h1 className="serif mt-2 text-4xl text-forest">{host?.name||'Host'}</h1><p className="mt-3 max-w-2xl text-sm text-forest/55">{locale==='ar'?'هذه مساحتك التشغيلية. تظهر هنا المهام المسندة إليك فقط.':'Only tasks assigned to you are shown here.'}</p></div><Link href="/admin/host-tasks" className="btn btn-primary">{locale==='ar'?'فتح مهامي':'فتح مهامي'}</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><Stat label={locale==='ar'?'المهام النشطة':'ACTIVE TASKS'} value={(tasks||[]).filter((x:any)=>!['COMPLETED','CANCELLED'].includes(x.status)).length} href="/admin/host-tasks"/><Stat label={locale==='ar'?'مهام اليوم':'TODAY'} value={(tasks||[]).filter((x:any)=>x.date===new Date().toISOString().slice(0,10)).length} href="/admin/host-tasks"/></div><div className="mt-7 card p-6"><div className="eyebrow">{locale==='ar'?'المهام المسندة إليك':'المهام المسندة إليك'}</div><div className="mt-5 grid gap-3">{(!tasks||tasks.length===0)?<div className="rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/50">{locale==='ar'?'لا توجد مهام مسندة.':'No assigned tasks.'}</div>:tasks.map((x:any)=><Link key={x.id} href="/admin/host-tasks" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-forest/10 p-4"><div><div className="text-xs font-semibold text-gold">{x.task_id}</div><div className="mt-1 font-semibold text-forest">{String(x.task_type||'Task').replaceAll('_',' ')}</div><div className="mt-1 text-xs text-forest/45">{x.date||'—'} · {x.start_time||'—'} · {x.location||'—'}</div></div><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[11px] font-semibold text-forest">{String(x.status||'PENDING').replaceAll('_',' ')}</span></Link>)}</div></div></section>;
 }
 if(role==='SALES') return <SalesDashboard locale={locale}/>;
 if(role==='FINANCE') return <FinanceDashboard locale={locale}/>;
 if(role==='OPERATIONS_MANAGER') return <OperationsManagerDashboard locale={locale}/>;
 if(role==='OPERATIONS') return <OperationsDashboard locale={locale}/>;
 if(role==='ADMIN') return <ManagementDashboard locale={locale}/>;
 return <ManagementDashboard locale={locale} superAdmin/>;
}
