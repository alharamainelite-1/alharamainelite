import Link from "next/link";
import {getSupabaseAdmin} from "@/lib/supabase/server";
import {getCurrentStaff} from "@/lib/supabase/auth";
import {getAdminLocale} from "@/lib/admin-locale";
import {adminText} from "@/lib/admin-text";

export default async function AdminHome(){
 const staff=await getCurrentStaff(); if(!staff)return null;
 const locale=await getAdminLocale(); const t=adminText[locale];
 const role=staff.profile.role;
 const canViewFinancial=role==='SUPER_ADMIN'||role==='FINANCE';

 if(role==='HOST'){
  const {data:host}=await getSupabaseAdmin().from('hosts').select('id,name').eq('user_id',staff.profile.id).maybeSingle();
  const {data:hostTasks,error:hostError}=host?await getSupabaseAdmin().from('host_tasks').select('id,task_id,date,start_time,end_time,location,task_type,status,notes,group_id').eq('host_id',host.id).order('date',{ascending:true}).order('start_time',{ascending:true}).limit(50):{data:[],error:null};
  return <section className="pb-12">
   <div className="flex flex-wrap items-end justify-between gap-5">
    <div><div className="eyebrow">HOST WORKSPACE</div><h1 className="serif mt-2 text-4xl text-forest">{host?.name||'Host'}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-forest/55">{locale==='ar'?'هذه مساحتك التشغيلية. تظهر هنا المهام المسندة إليك فقط.':'This is your operational workspace. Only tasks assigned to you are shown here.'}</p></div>
    <Link href="/admin/host-tasks" className="btn btn-primary">{locale==='ar'?'فتح مهامي':'Open My Tasks'}</Link>
   </div>
   {hostError&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{hostError.message}</div>}
   {!host&&<div className="mt-7 card p-8"><h2 className="serif text-2xl text-forest">{locale==='ar'?'لم يتم ربط حساب المضيف':'No host profile linked'}</h2><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'تواصل مع مدير العمليات لربط حسابك بملف المضيف.':'Ask the Operations Manager to link your staff account to a host profile.'}</p></div>}
   <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div className="card p-6"><div className="eyebrow">{locale==='ar'?'المهام النشطة':'ACTIVE TASKS'}</div><div className="serif mt-2 text-4xl text-forest">{(hostTasks||[]).filter((x:any)=>!['COMPLETED','CANCELLED'].includes(x.status)).length}</div></div>
    <div className="card p-6"><div className="eyebrow">{locale==='ar'?'مهام اليوم':'TODAY'}</div><div className="serif mt-2 text-4xl text-forest">{(hostTasks||[]).filter((x:any)=>x.date===new Date().toISOString().slice(0,10)).length}</div></div>
   </div>
   <div className="mt-7 card p-6">
    <div className="eyebrow">{locale==='ar'?'المهام المسندة إليك':'YOUR ASSIGNED TASKS'}</div>
    <div className="mt-5 grid gap-3">
     {(!hostTasks||hostTasks.length===0)?<div className="rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/50">{locale==='ar'?'لا توجد مهام مسندة إليك حالياً.':'No tasks are currently assigned to you.'}</div>:
      hostTasks.map((x:any)=><Link key={x.id} href="/admin/host-tasks" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-forest/10 p-4 hover:border-gold/50">
       <div><div className="text-xs font-semibold text-gold">{x.task_id}</div><div className="mt-1 font-semibold text-forest">{String(x.task_type||'Task').replaceAll('_',' ')}</div><div className="mt-1 text-xs text-forest/45">{x.date||'—'} · {x.start_time||'—'} · {x.location||'—'}</div></div>
       <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[11px] font-semibold text-forest">{String(x.status||'PENDING').replaceAll('_',' ')}</span>
      </Link>)}
    </div>
   </div>
  </section>;
 }
 let stats={requests:0,active:0,pendingPayments:0,completed:0,overdue:0,revenue:0};
 let recent:any[]=[]; let error="";
 try{
  const s=getSupabaseAdmin();
  const base=[
    s.from("journey_requests").select("*",{count:"exact",head:true}),
    s.from("bookings").select("*",{count:"exact",head:true}).in("status",["CONFIRMED","PREPARING","ACTIVE"]),
    s.from("operations_tasks").select("id,date,status",{count:"exact",head:true}).lt("date",new Date().toISOString().slice(0,10)).neq("status","COMPLETED").neq("status","CANCELLED"),
    s.from("bookings").select("id,booking_id,status,guest_count,created_at,customers(full_name),packages(name)").order("created_at",{ascending:false}).limit(6)
  ];
  const [r,a,taskCount,j]=await Promise.all(base);
  if([r,a,taskCount,j].some(x=>x.error))throw new Error("Unable to load live dashboard data.");
  stats.requests=r.count||0; stats.active=a.count||0; stats.overdue=taskCount.count||0; recent=j.data||[];
  if(canViewFinancial){
    const [p,d,pay]=await Promise.all([
      s.from("bookings").select("*",{count:"exact",head:true}).in("payment_status",["PAYMENT_INSTRUCTIONS_SENT","PENDING_VERIFICATION"]),
      s.from("bookings").select("*",{count:"exact",head:true}).eq("status","COMPLETED"),
      s.from("payments").select("amount,status")
    ]);
    if([p,d,pay].some(x=>x.error))throw new Error("Unable to load financial dashboard data.");
    stats.pendingPayments=p.count||0; stats.completed=d.count||0;
    stats.revenue=((pay.data||[]) as any[]).filter(x=>x.status==="RECEIVED").reduce((n,x)=>n+Number(x.amount||0),0);
  }else{
    const d=await s.from("bookings").select("*",{count:"exact",head:true}).eq("status","COMPLETED");
    stats.completed=d.count||0;
  }
 }catch(e){error=e instanceof Error?e.message:"Unable to load dashboard."}
 const isSales=role==="SALES"; const isOps=role==="OPERATIONS_MANAGER"||role==="OPERATIONS";
 const title=isSales?t.sales:isOps?t.ops:t.executive;
 const intro=isSales?t.salesIntro:isOps?t.opsIntro:t.execIntro;
 const taskByRole:any={
  SUPER_ADMIN:{en:['Executive control','Team, security, settings and the full operating picture.','/admin/team'],ar:['الإدارة العليا','الفريق والأمان والإعدادات والصورة التشغيلية الكاملة.','/admin/team']},
  ADMIN:{en:['Management workspace','Manage customers, journeys and operations. Financial workspaces are restricted.','/admin/operations'],ar:['مساحة الإدارة','إدارة العملاء والرحلات والعمليات. المساحات المالية مقيدة.','/admin/operations']},
  SALES:{en:['Sales task','Follow new requests, speak with customers and move qualified journeys to payment.','/admin/requests'],ar:['مهمة المبيعات','متابعة الطلبات الجديدة والتواصل مع العملاء ونقل الرحلات المؤهلة إلى مرحلة الدفع.','/admin/requests']},
  FINANCE:{en:['Finance task','Verify incoming payments and maintain expenses and financial reports.','/admin/payments'],ar:['المهمة المالية','التحقق من المدفوعات الواردة وإدارة المصروفات والتقارير المالية.','/admin/payments']},
  OPERATIONS_MANAGER:{en:['Operations manager task','Build groups, assign resources and keep every operational task on schedule.','/admin/operations'],ar:['مهمة مدير العمليات','بناء المجموعات وتوزيع الموارد والحفاظ على جاهزية جميع المهام التشغيلية.','/admin/operations']},
  OPERATIONS:{en:['Operations task','Execute assigned operational work and update task status.','/admin/operations'],ar:['المهمة التشغيلية','تنفيذ المهام التشغيلية المسندة وتحديث حالتها.','/admin/operations']},
  HOST:{en:['Host task','See only your assigned host tasks and update them as you complete each step.','/admin/host-tasks'],ar:['مهمة المضيف','عرض مهامك المسندة فقط وتحديثها عند إكمال كل خطوة.','/admin/host-tasks']}
 };
 const task=taskByRole[role]?.[locale]||taskByRole[role]?.en;
 return <section className="pb-12">
  <div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-2 text-3xl sm:text-4xl xl:text-5xl text-forest">{title}</h1><p className="mt-3 max-w-2xl text-forest/55">{intro}</p></div><Link href="/admin/journeys" className="btn btn-primary">{t.openJourneys}</Link></div>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  {task&&<div className="mt-7 card border-gold/30 bg-white p-6"><div className="eyebrow">{locale==='ar'?'مهمتك الآن':'Your responsibility'}</div><div className="mt-2 flex flex-wrap items-center justify-between gap-4"><div><h2 className="serif text-2xl text-forest">{task[0]}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-forest/55">{task[1]}</p></div><Link href={task[2]} className="btn btn-outline">{locale==='ar'?'فتح مساحة العمل':'Open workspace'}</Link></div></div>}
  <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <Link href="/admin/requests" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.newRequests}</div><div className="serif mt-2 text-4xl text-forest">{stats.requests}</div><div className="mt-2 text-xs text-forest/45">Start the customer conversation →</div></Link>
   <Link href="/admin/journeys" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.activeJourneys}</div><div className="serif mt-2 text-4xl text-forest">{stats.active}</div><div className="mt-2 text-xs text-forest/45">Open journey workspace →</div></Link>
   {canViewFinancial&&<Link href="/admin/payments" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.paymentActions}</div><div className="serif mt-2 text-4xl text-forest">{stats.pendingPayments}</div><div className="mt-2 text-xs text-forest/45">Verify or follow up →</div></Link>}
   <Link href="/admin/operations" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.operationalIssues}</div><div className="serif mt-2 text-4xl text-forest">{stats.overdue}</div><div className="mt-2 text-xs text-forest/45">Open operations →</div></Link>
  </div>
  <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
   <div className="card min-w-0 overflow-hidden p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">Journey queue</div><h2 className="serif mt-2 text-3xl text-forest">{t.recentJourneys}</h2></div><Link href="/admin/journeys" className="text-sm font-semibold text-gold">{t.viewAll}</Link></div>
    <div className="mt-5 grid gap-3">{recent.length===0?<div className="rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/50">No journeys yet.</div>:recent.map(r=><Link key={r.id} href={"/admin/journeys/"+r.id} className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-forest/10 p-4 hover:border-gold/50"><div className="min-w-0"><div className="text-xs font-semibold text-gold">{r.booking_id}</div><div className="mt-1 break-words font-semibold text-forest">{r.customers?.full_name||"Unnamed customer"}</div><div className="mt-1 text-xs text-forest/45">{r.packages?.name||"—"} · {r.guest_count} guests</div></div><div className="shrink-0 text-right"><div className="mt-1 rounded-full bg-[#f7f3ea] px-3 py-1 text-[11px] font-semibold text-forest">{r.status.replaceAll("_"," ")}</div></div></Link>)}</div>
   </div>
   <div className="grid gap-6">
    <div className="card p-6"><div className="eyebrow">{t.needsAttention}</div><div className="mt-4 grid gap-3">{canViewFinancial&&stats.pendingPayments>0&&<Link href="/admin/payments" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="font-semibold text-forest">{stats.pendingPayments} payment action{stats.pendingPayments===1?"":"s"}</div><div className="mt-1 text-xs text-forest/55">Review payment status.</div></Link>}{stats.overdue>0&&<Link href="/admin/operations" className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="font-semibold text-forest">{stats.overdue} operational issue{stats.overdue===1?"":"s"}</div><div className="mt-1 text-xs text-forest/55">Resolve delayed or overdue tasks.</div></Link>}{(!canViewFinancial||stats.pendingPayments===0)&&stats.overdue===0&&<div className="rounded-xl bg-[#f7f3ea] p-4 text-sm text-forest/55">{t.nothingUrgent}</div>}</div></div>
    {canViewFinancial&&<div className="card p-6"><div className="eyebrow">{t.businessSnapshot}</div><div className="mt-4 grid gap-4"><div className="flex justify-between border-b border-forest/10 pb-3"><span className="text-sm text-forest/55">{t.paymentsReceived}</span><b className="text-forest">USD {stats.revenue.toLocaleString()}</b></div><div className="flex justify-between"><span className="text-sm text-forest/55">{t.completedJourneys}</span><b className="text-forest">{stats.completed}</b></div></div></div>}
   </div>
  </div>
  <div className="mt-8 card p-6"><div className="eyebrow">{t.operatingModel}</div><div className="mt-4 grid gap-3 md:grid-cols-4">{[["1",t.inbox,t.followup,"/admin/requests"],["2",t.journeyFile,t.customerBooking,"/admin/journeys"],["3",t.operationsLabel,t.readiness,"/admin/operations"],["4",t.management,t.financeTeam,"/admin/team"]].map(([n,k,d,h])=><Link href={h} key={k} className="rounded-xl bg-[#f7f3ea] p-5 hover:bg-white"><div className="text-xs font-bold text-gold">{n}</div><div className="mt-2 font-semibold text-forest">{k}</div><div className="mt-1 text-xs text-forest/50">{d}</div></Link>)}</div></div>
 </section>
}
