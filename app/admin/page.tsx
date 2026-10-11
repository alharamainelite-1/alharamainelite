import Link from "next/link";
import {getSupabaseAdmin} from "@/lib/supabase/server";
import {getCurrentStaff} from "@/lib/supabase/auth";
import {getAdminLocale} from "@/lib/admin-locale";
import {adminText} from "@/lib/admin-text";
import ExecutiveOverview from "@/components/admin/ExecutiveOverview";

const roleConfig:any={
 SALES:{en:{eyebrow:"SALES WORKSPACE",title:"Sales",intro:"Your workspace is focused on new leads, customer conversations and moving qualified requests forward.",primary:"Open Requests",href:"/admin/requests"},ar:{eyebrow:"مساحة المبيعات",title:"المبيعات",intro:"مساحتك مخصصة للطلبات الجديدة والتواصل مع العملاء ونقل الطلبات المؤهلة إلى المرحلة التالية.",primary:"فتح الطلبات",href:"/admin/requests"}},
 BOOKINGS:{en:{eyebrow:"BOOKINGS WORKSPACE",title:"Bookings",intro:"Create and maintain booking records from accepted Sales handovers. Payment receipt is verified by Finance only.",primary:"Open Bookings",href:"/admin/bookings"},ar:{eyebrow:"مساحة الحجوزات",title:"الحجوزات",intro:"إنشاء وتحديث سجلات الحجوزات بعد قبول التسليم من المبيعات. المالية وحدها تعتمد استلام المدفوعات.",primary:"فتح الحجوزات",href:"/admin/bookings"}},
 FINANCE:{en:{eyebrow:"FINANCE WORKSPACE",title:"Finance",intro:"Your workspace is focused on payment verification, expenses and financial reporting.",primary:"Open Payments",href:"/admin/payments"},ar:{eyebrow:"المساحة المالية",title:"المالية",intro:"مساحتك مخصصة للتحقق من المدفوعات والمصروفات والتقارير المالية.",primary:"فتح المدفوعات",href:"/admin/payments"}},
 OPERATIONS_MANAGER:{en:{eyebrow:"OPERATIONS MANAGEMENT",title:"Operations Manager",intro:"Your workspace is focused on groups, resources, hosts and keeping every journey operationally ready.",primary:"Open Operations",href:"/admin/operations"},ar:{eyebrow:"إدارة العمليات",title:"مدير العمليات",intro:"مساحتك مخصصة للمجموعات والموارد والمضيفين وجاهزية الرحلات التشغيلية.",primary:"فتح العمليات",href:"/admin/operations"}},
 OPERATIONS:{en:{eyebrow:"OPERATIONS WORKSPACE",title:"Operations",intro:"Your workspace is focused on assigned operational work, schedules, resources and task completion.",primary:"Open My Operations",href:"/admin/operations"},ar:{eyebrow:"مساحة العمليات",title:"العمليات",intro:"مساحتك مخصصة للمهام التشغيلية والجدولة والموارد وإنجاز المهام المسندة.",primary:"فتح العمليات",href:"/admin/operations"}},
 OPERATIONS_SUPERVISOR:{en:{eyebrow:"OPERATIONS SUPERVISION",title:"Operations Supervisor",intro:"Coordinate trip readiness, guide journey coordinators and resolve scheduling or resource conflicts.",primary:"Open Operations",href:"/admin/operations"},ar:{eyebrow:"الإشراف على العمليات",title:"مشرف العمليات",intro:"متابعة جاهزية الرحلات وتوجيه المنسقين وحل تعارضات الجدولة والموارد.",primary:"فتح العمليات",href:"/admin/operations"}},
 JOURNEY_COORDINATOR:{en:{eyebrow:"JOURNEY COORDINATION",title:"Journey Coordinator",intro:"Organize the schedule and tasks for journeys assigned to you, then follow execution through completion.",primary:"Open Assigned Journeys",href:"/admin/groups"},ar:{eyebrow:"تنسيق الرحلات",title:"منسق العمليات",intro:"تنظيم جداول ومهام الرحلات المسندة إليك ومتابعة التنفيذ حتى الإكمال.",primary:"فتح الرحلات المسندة",href:"/admin/groups"}},
 MARKETING:{en:{eyebrow:"MARKETING WORKSPACE",title:"Marketing",intro:"Coordinate approved marketing content, communications and lead handover to sales.",primary:"Open Communications",href:"/admin/communications"},ar:{eyebrow:"مساحة التسويق",title:"التسويق",intro:"تنسيق المحتوى التسويقي المعتمد والتواصل وتسليم العملاء المحتملين للمبيعات.",primary:"فتح التواصل",href:"/admin/communications"}},
 CUSTOMER_SERVICE:{en:{eyebrow:"CUSTOMER SERVICE",title:"Customer Service",intro:"Support customers, follow up on questions and coordinate accurate booking updates.",primary:"Open Customers",href:"/admin/guests"},ar:{eyebrow:"خدمة العملاء",title:"خدمة العملاء",intro:"خدمة العملاء ومتابعة الاستفسارات وتنسيق تحديثات الحجوزات بدقة.",primary:"فتح العملاء",href:"/admin/guests"}},
 SUPER_ADMIN:{en:{eyebrow:"EXECUTIVE CONTROL",title:"General Manager",intro:"Full control of the platform, team permissions, security and business operations.",primary:"Open Team",href:"/admin/team"},ar:{eyebrow:"الإدارة العامة",title:"المدير العام",intro:"تحكم كامل في المنصة والفريق والصلاحيات والأمان والعمليات.",primary:"فتح الفريق",href:"/admin/team"}}
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
 </div><WorkspaceSteps items={locale==='ar'?["استلام الطلب","التواصل مع العميل","استكمال التفاصيل","تسليم الطلب إلى الحجوزات"]:["Receive request","Contact customer","Complete details","Hand off to Bookings"]} links={["/admin/requests","/admin/requests","/admin/requests","/admin/requests"]}/></RoleShell>
}

async function FinanceDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin();
 const [pending,received,expenses]=await Promise.all([
  s.from("payments").select("*",{count:"exact",head:true}).in("status",["PENDING_VERIFICATION","PAYMENT_INSTRUCTIONS_SENT"]),
  s.from("payments").select("amount,status").eq("status","RECEIVED"),
  s.from("expenses").select("*",{count:"exact",head:true})
 ]);
 const revenue=((received.data||[]) as any[]).reduce((n,x)=>n+Number(x.amount||0),0);
 return <RoleShell cfg={roleConfig.FINANCE[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Stat label={locale==='ar'?'إجراءات الدفع':'PAYMENT ACTIONS'} value={pending.count||0} href="/admin/payments"/><Stat label={locale==='ar'?'المبالغ المستلمة':'RECEIVED'} value={'USD '+revenue.toLocaleString()} href="/admin/payments"/><Stat label={locale==='ar'?'المصروفات':'EXPENSES'} value={expenses.count||0} href="/admin/expenses"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة التحويل","مطابقة الحجز","تأكيد الاستلام","تحديث السجلات"]:["Review transfer","Match booking","Confirm receipt","Update records"]} links={["/admin/payments","/admin/payments","/admin/payments","/admin/reports"]}/></RoleShell>
}

async function OperationsManagerDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin(); const today=new Date().toISOString().slice(0,10);
 const [tasks,groups,hosts,vehicles,overdue]=await Promise.all([
  s.from("operations_tasks").select("id",{count:"exact",head:true}).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
  s.from("groups").select("id",{count:"exact",head:true}),
  s.from("hosts").select("id",{count:"exact",head:true}).in("status",["AVAILABLE","ASSIGNED"]),
  s.from("vehicles").select("id",{count:"exact",head:true}).in("status",["AVAILABLE","ASSIGNED"]),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).lt("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)")
 ]);
 return <RoleShell cfg={roleConfig.OPERATIONS_MANAGER[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Stat label={locale==='ar'?'المهام المفتوحة':'OPEN TASKS'} value={tasks.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'المهام المتأخرة':'OVERDUE TASKS'} value={overdue.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'المجموعات':'GROUPS'} value={groups.count||0} href="/admin/groups"/><Stat label={locale==='ar'?'المضيفون المتاحون':'AVAILABLE HOSTS'} value={hosts.count||0} href="/admin/hosts"/><Stat label={locale==='ar'?'المركبات المتاحة':'AVAILABLE VEHICLES'} value={vehicles.count||0} href="/admin/transportation"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة الرحلات المؤكدة","بناء المجموعات","توزيع الموارد","متابعة الجاهزية"]:["Review confirmed journeys","Build groups","Assign resources","Monitor readiness"]} links={["/admin/journeys","/admin/groups","/admin/operations","/admin/operations"]}/></RoleShell>
}

async function OperationsDashboard({locale,staffId}:{locale:'en'|'ar';staffId:string}){
 const s=getSupabaseAdmin(); const today=new Date().toISOString().slice(0,10);
 const [open,accepted,todayTasks,overdue]=await Promise.all([
  s.from("operations_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).eq("status","ACCEPTED"),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).eq("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).lt("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)")
 ]);
 return <RoleShell cfg={roleConfig.OPERATIONS[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label={locale==='ar'?'مهامي المفتوحة':'MY OPEN TASKS'} value={open.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'مهامي المقبولة':'MY ACCEPTED TASKS'} value={accepted.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'مهامي اليوم':'MY TASKS TODAY'} value={todayTasks.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'مهامي المتأخرة':'MY OVERDUE TASKS'} value={overdue.count||0} href="/admin/operations"/></div><WorkspaceSteps items={locale==='ar'?["راجع مهامك المسندة","نفذ المهمة","حدّث الحالة","أبلغ عن أي تعارض"]:["Review assigned tasks","Execute the task","Update its status","Report conflicts"]} links={["/admin/operations","/admin/operations","/admin/operations","/admin/operations"]}/></RoleShell>
}

async function OperationsSupervisorDashboard({locale}:{locale:'en'|'ar'}){
 const s=getSupabaseAdmin(); const today=new Date().toISOString().slice(0,10);
 const [open,overdue,todayTasks,unassigned]=await Promise.all([
  s.from("operations_tasks").select("id",{count:"exact",head:true}).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).lt("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).eq("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
  s.from("operations_tasks").select("id",{count:"exact",head:true}).is("assigned_staff_id",null).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)")
 ]);
 return <RoleShell cfg={roleConfig.OPERATIONS_SUPERVISOR[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label={locale==='ar'?'المهام المفتوحة':'OPEN TASKS'} value={open.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'المهام المتأخرة':'OVERDUE TASKS'} value={overdue.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'مهام اليوم':'DUE TODAY'} value={todayTasks.count||0} href="/admin/operations"/><Stat label={locale==='ar'?'تحتاج إلى إسناد':'NEED ASSIGNMENT'} value={unassigned.count||0} href="/admin/operations"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة الرحلات القادمة","إسناد المنسقين","متابعة المهام","حل تعارض الموارد"]:["Review upcoming journeys","Assign coordinators","Monitor tasks","Resolve resource conflicts"]} links={["/admin/groups","/admin/groups","/admin/operations","/admin/operations"]}/></RoleShell>
}

async function JourneyCoordinatorDashboard({locale,staffId}:{locale:'en'|'ar';staffId:string}){
 const s=getSupabaseAdmin(); const today=new Date().toISOString().slice(0,10);
 const {data:groups,error}=await s.from("groups").select("id").eq("operations_coordinator_id",staffId).limit(500);
 const ids=(groups||[]).map((g:any)=>g.id);
 let open=0,overdue=0,todayTasks=0;
 if(!error&&ids.length){
  const [a,b,c]=await Promise.all([
   s.from("operations_tasks").select("id",{count:"exact",head:true}).in("group_id",ids).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
   s.from("operations_tasks").select("id",{count:"exact",head:true}).in("group_id",ids).lt("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)"),
   s.from("operations_tasks").select("id",{count:"exact",head:true}).in("group_id",ids).eq("date",today).not("status","in","(COMPLETED,VERIFIED,CLOSED,CANCELLED)")
  ]);open=a.count||0;overdue=b.count||0;todayTasks=c.count||0;
 }
 return <RoleShell cfg={roleConfig.JOURNEY_COORDINATOR[locale]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label={locale==='ar'?'الرحلات المسندة':'MY JOURNEYS'} value={ids.length} href="/admin/groups"/><Stat label={locale==='ar'?'المهام المفتوحة':'OPEN TASKS'} value={open} href="/admin/operations"/><Stat label={locale==='ar'?'المهام المتأخرة':'OVERDUE TASKS'} value={overdue} href="/admin/operations"/><Stat label={locale==='ar'?'مهام اليوم':'DUE TODAY'} value={todayTasks} href="/admin/operations"/></div><WorkspaceSteps items={locale==='ar'?["مراجعة الرحلات المسندة","إعداد جدول الرحلة","إسناد المضيف والمركبة","متابعة التنفيذ"]:["Review assigned journeys","Plan the journey schedule","Assign host and vehicle","Track execution"]} links={["/admin/groups","/admin/operations","/admin/operations","/admin/operations"]}/></RoleShell>
}

async function StaffWorkloadDashboard({locale,staffId,role}:{locale:'en'|'ar';staffId:string;role:'BOOKINGS'|'MARKETING'|'CUSTOMER_SERVICE'}){
 const s=getSupabaseAdmin(); const today=new Date().toISOString().slice(0,10);
 const [open,todayTasks,overdue,completed]=await Promise.all([
  s.from("staff_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).in("status",["ASSIGNED","ACCEPTED","IN_PROGRESS"]),
  s.from("staff_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).gte("due_at",today+"T00:00:00.000Z").lt("due_at",today+"T23:59:59.999Z").in("status",["ASSIGNED","ACCEPTED","IN_PROGRESS"]),
  s.from("staff_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).lt("due_at",new Date().toISOString()).in("status",["ASSIGNED","ACCEPTED","IN_PROGRESS"]),
  s.from("staff_tasks").select("id",{count:"exact",head:true}).eq("assigned_staff_id",staffId).eq("status","COMPLETED")
 ]);
 const cfg=roleConfig[role][locale];
 const steps=role==='BOOKINGS'?(locale==='ar'?["راجع تسليم المبيعات","تحقق من بيانات العميل","حدّث سجل الحجز","نسّق حالة الدفع مع المالية"]:["Review Sales handover","Verify customer details","Update booking record","Coordinate payment status with Finance"]):role==='MARKETING'?(locale==='ar'?["راجع المهام والحملات المسندة","جهّز المحتوى المعتمد","تابع العملاء المحتملين","سلّم النتائج إلى المبيعات"]:["Review assigned campaigns","Prepare approved content","Track generated leads","Hand results to Sales"]):(locale==='ar'?["راجع استفسارات العملاء المسندة","حدّث معلومات المتابعة","نسّق مع الحجوزات","صعّد الحالات التي تحتاج تدخلًا"]:["Review assigned customer enquiries","Update follow-up records","Coordinate with Bookings","Escalate cases needing intervention"]);
 const links=role==='BOOKINGS'?["/admin/staff-tasks","/admin/bookings","/admin/bookings","/admin/payments"]:role==='MARKETING'?["/admin/staff-tasks","/admin/communications","/admin/requests","/admin/requests"]:["/admin/staff-tasks","/admin/guests","/admin/bookings","/admin/communications"];
 return <RoleShell cfg={cfg}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label={locale==='ar'?'مهامي المفتوحة':'MY OPEN TASKS'} value={open.count||0} href="/admin/staff-tasks"/><Stat label={locale==='ar'?'مهام مستحقة اليوم':'DUE TODAY'} value={todayTasks.count||0} href="/admin/staff-tasks"/><Stat label={locale==='ar'?'مهامي المتأخرة':'MY OVERDUE TASKS'} value={overdue.count||0} href="/admin/staff-tasks"/><Stat label={locale==='ar'?'مهام مكتملة':'COMPLETED TASKS'} value={completed.count||0} href="/admin/staff-tasks"/></div><WorkspaceSteps items={steps} links={links}/><div className="mt-4 card p-5"><p className="text-sm leading-6 text-forest/65">{locale==='ar'?'تُحتسب المؤشرات من المهام المسندة إلى حسابك فقط. افتح مساحة المهام لقبول التكليفات أو بدء تنفيذها أو تسجيل الإكمال والتسليم.':'Counters reflect tasks assigned to your account only. Open Staff Tasks to accept assignments, start work, record completion and hand work over.'}</p><Link href="/admin/staff-tasks" className="btn btn-secondary mt-4">{locale==='ar'?'فتح مهامي':'Open my tasks'}</Link></div></RoleShell>;
}

async function ManagementDashboard({locale}:{locale:'en'|'ar'}) {
 const cfg=roleConfig.SUPER_ADMIN[locale];
 return <RoleShell cfg={cfg}><div className="mb-5 flex justify-end"><Link href="/admin/journey-archive" className="btn btn-secondary">{locale==='ar'?'إدارة الرحلات التجريبية':'Manage test journeys'}</Link></div><ExecutiveOverview locale={locale}/></RoleShell>;
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
  const [{data:legacyTasks},{data:operationsTasks}]=host?await Promise.all([
   s.from('host_tasks').select('id,task_id,date,start_time,end_time,location,task_type,status,cancellation_reason,cancelled_at').eq('host_id',host.id).order('date',{ascending:true}).order('start_time',{ascending:true}).limit(50),
   s.from('operations_tasks').select('id,task_id,date,start_time,end_time,location,task_type,status,cancellation_reason,cancelled_at').eq('assigned_host',host.id).order('date',{ascending:true}).order('start_time',{ascending:true}).limit(50)
  ]):[{data:[]},{data:[]}];
  const tasks=[...(legacyTasks||[]),...(operationsTasks||[])].sort((a:any,b:any)=>String(a.date).localeCompare(String(b.date))||String(a.start_time||'').localeCompare(String(b.start_time||'')));
  return <section className="pb-12"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">{locale==='ar'?'مساحة المضيف':'HOST WORKSPACE'}</div><h1 className="serif mt-2 text-4xl text-forest">{host?.name||'Host'}</h1><p className="mt-3 max-w-2xl text-sm text-forest/55">{locale==='ar'?'هذه مساحتك التشغيلية. تظهر هنا المهام المسندة إليك فقط.':'Only tasks assigned to you are shown here.'}</p></div><Link href="/admin/host-tasks" className="btn btn-primary">{locale==='ar'?'فتح مهامي':'Open my tasks'}</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><Stat label={locale==='ar'?'المهام النشطة':'ACTIVE TASKS'} value={(tasks||[]).filter((x:any)=>!['COMPLETED','CANCELLED'].includes(x.status)).length} href="/admin/host-tasks"/><Stat label={locale==='ar'?'مهام اليوم':'TODAY'} value={(tasks||[]).filter((x:any)=>x.date===new Date().toISOString().slice(0,10)).length} href="/admin/host-tasks"/></div><div className="mt-7 card p-6"><div className="eyebrow">{locale==='ar'?'المهام المسندة إليك':'المهام المسندة إليك'}</div><div className="mt-5 grid gap-3">{(!tasks||tasks.length===0)?<div className="rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/50">{locale==='ar'?'لا توجد مهام مسندة.':'No assigned tasks.'}</div>:tasks.map((x:any)=><Link key={x.id} href="/admin/host-tasks" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-forest/10 p-4"><div><div className="text-xs font-semibold text-gold">{x.task_id}</div><div className="mt-1 font-semibold text-forest">{String(x.task_type||'Task').replaceAll('_',' ')}</div><div className="mt-1 text-xs text-forest/45">{x.date||'—'} · {x.start_time||'—'} · {x.location||'—'}</div>{x.status==='CANCELLED'&&<div className="mt-2 text-xs text-red-700">{locale==='ar'?'سبب الإلغاء: ':'Cancellation reason: '}{x.cancellation_reason|| (locale==='ar'?'غير مسجل':'Not recorded')}{x.cancelled_at?' · '+new Date(x.cancelled_at).toLocaleString(locale==='ar'?'ar-SA':'en-GB'):''}</div>}</div><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[11px] font-semibold text-forest">{String(x.status||'PENDING').replaceAll('_',' ')}</span></Link>)}</div></div></section>;
 }
 if(role==='SALES') return <SalesDashboard locale={locale}/>;
 if(role==='BOOKINGS') return <StaffWorkloadDashboard locale={locale} staffId={staff.profile.id} role="BOOKINGS"/>;
 if(role==='FINANCE') return <FinanceDashboard locale={locale}/>;
 if(role==='OPERATIONS_MANAGER') return <OperationsManagerDashboard locale={locale}/>;
 if(role==='OPERATIONS') return <OperationsDashboard locale={locale} staffId={staff.profile.id}/>;
 if(role==='OPERATIONS_SUPERVISOR') return <OperationsSupervisorDashboard locale={locale}/>;
 if(role==='JOURNEY_COORDINATOR') return <JourneyCoordinatorDashboard locale={locale} staffId={staff.profile.id}/>;
 if(role==='MARKETING') return <StaffWorkloadDashboard locale={locale} staffId={staff.profile.id} role="MARKETING"/>;
 if(role==='CUSTOMER_SERVICE') return <StaffWorkloadDashboard locale={locale} staffId={staff.profile.id} role="CUSTOMER_SERVICE"/>;
 return <ManagementDashboard locale={locale}/>;
}
