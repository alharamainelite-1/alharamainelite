import Link from "next/link";
import {getSupabaseAdmin} from "@/lib/supabase/server";
import {getCurrentStaff} from "@/lib/supabase/auth";
import {getAdminLocale} from "@/lib/admin-locale";
import {adminText} from "@/lib/admin-text";

export default async function AdminHome(){
 const staff=await getCurrentStaff(); if(!staff)return null;
 const locale=await getAdminLocale(); const t=adminText[locale];
 const role=staff.profile.role; let stats={requests:0,active:0,pendingPayments:0,completed:0,overdue:0,revenue:0}; let recent:any[]=[]; let error="";
 try{
  const s=getSupabaseAdmin();
  const [r,a,p,d,taskCount,pay,j]=await Promise.all([s.from("journey_requests").select("*",{count:"exact",head:true}),s.from("bookings").select("*",{count:"exact",head:true}).in("status",["CONFIRMED","PREPARING","ACTIVE"]),s.from("bookings").select("*",{count:"exact",head:true}).in("payment_status",["PAYMENT_INSTRUCTIONS_SENT","PENDING_VERIFICATION"]),s.from("bookings").select("*",{count:"exact",head:true}).eq("status","COMPLETED"),s.from("operations_tasks").select("id,date,status",{count:"exact",head:true}).lt("date",new Date().toISOString().slice(0,10)).not("status","in","(COMPLETED,CANCELLED)"),s.from("payments").select("amount,status"),s.from("bookings").select("id,booking_id,status,payment_status,total_amount,guest_count,created_at,customers(full_name),packages(name)").order("created_at",{ascending:false}).limit(6)]);
  if([r,a,p,d,taskCount,pay,j].some(x=>x.error))throw new Error("Unable to load live dashboard data.");
  stats={requests:r.count||0,active:a.count||0,pendingPayments:p.count||0,completed:d.count||0,overdue:taskCount.count||0,revenue:((pay.data||[]) as any[]).filter(x=>x.status==="RECEIVED").reduce((n,x)=>n+Number(x.amount),0)}; recent=j.data||[];
 }catch(e){error=e instanceof Error?e.message:"Unable to load dashboard."}
 const isSales=role==="SALES"; const isOps=role==="OPERATIONS_MANAGER"||role==="OPERATIONS";
 const title=isSales?t.sales:isOps?t.ops:t.executive;
 const intro=isSales?t.salesIntro:isOps?t.opsIntro:t.execIntro;
 return <section className="pb-12">
  <div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-2 text-3xl sm:text-4xl xl:text-5xl text-forest">{title}</h1><p className="mt-3 max-w-2xl text-forest/55">{intro}</p></div><Link href="/admin/journeys" className="btn btn-primary">{t.openJourneys}</Link></div>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <Link href="/admin/requests" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.newRequests}</div><div className="serif mt-2 text-4xl text-forest">{stats.requests}</div><div className="mt-2 text-xs text-forest/45">Start the customer conversation →</div></Link>
   <Link href="/admin/journeys" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.activeJourneys}</div><div className="serif mt-2 text-4xl text-forest">{stats.active}</div><div className="mt-2 text-xs text-forest/45">Open journey workspace →</div></Link>
   <Link href="/admin/payments" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.paymentActions}</div><div className="serif mt-2 text-4xl text-forest">{stats.pendingPayments}</div><div className="mt-2 text-xs text-forest/45">Verify or follow up →</div></Link>
   <Link href="/admin/operations" className="card p-6 hover:border-gold/50"><div className="eyebrow">{t.operationalIssues}</div><div className="serif mt-2 text-4xl text-forest">{stats.overdue}</div><div className="mt-2 text-xs text-forest/45">Open operations →</div></Link>
  </div>
  <div className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
   <div className="card p-6"><div className="flex items-end justify-between"><div><div className="eyebrow">Journey queue</div><h2 className="serif mt-2 text-3xl text-forest">{t.recentJourneys}</h2></div><Link href="/admin/journeys" className="text-sm font-semibold text-gold">{t.viewAll}</Link></div>
    <div className="mt-5 grid gap-3">{recent.length===0?<div className="rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/50">No journeys yet.</div>:recent.map(r=><Link key={r.id} href={"/admin/journeys/"+r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-forest/10 p-4 hover:border-gold/50"><div><div className="text-xs font-semibold text-gold">{r.booking_id}</div><div className="mt-1 font-semibold text-forest">{r.customers?.full_name||"Unnamed customer"}</div><div className="mt-1 text-xs text-forest/45">{r.packages?.name||"—"} · {r.guest_count} guests</div></div><div className="text-right"><div className="text-sm font-semibold text-forest">${Number(r.total_amount).toLocaleString()}</div><div className="mt-1 rounded-full bg-[#f7f3ea] px-3 py-1 text-[11px] font-semibold text-forest">{r.status.replaceAll("_"," ")}</div></div></Link>)}</div>
   </div>
   <div className="grid gap-6">
    <div className="card p-6"><div className="eyebrow">{t.needsAttention}</div><div className="mt-4 grid gap-3">{stats.pendingPayments>0&&<Link href="/admin/payments" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="font-semibold text-forest">{stats.pendingPayments} payment action{stats.pendingPayments===1?"":"s"}</div><div className="mt-1 text-xs text-forest/55">Review payment status.</div></Link>}{stats.overdue>0&&<Link href="/admin/operations" className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="font-semibold text-forest">{stats.overdue} operational issue{stats.overdue===1?"":"s"}</div><div className="mt-1 text-xs text-forest/55">Resolve delayed or overdue tasks.</div></Link>}{stats.pendingPayments===0&&stats.overdue===0&&<div className="rounded-xl bg-[#f7f3ea] p-4 text-sm text-forest/55">{t.nothingUrgent}</div>}</div></div>
    <div className="card p-6"><div className="eyebrow">{t.businessSnapshot}</div><div className="mt-4 grid gap-4"><div className="flex justify-between border-b border-forest/10 pb-3"><span className="text-sm text-forest/55">{t.paymentsReceived}</span><b className="text-forest">USD {stats.revenue.toLocaleString()}</b></div><div className="flex justify-between"><span className="text-sm text-forest/55">{t.completedJourneys}</span><b className="text-forest">{stats.completed}</b></div></div></div>
   </div>
  </div>
  <div className="mt-8 card p-6"><div className="eyebrow">{t.operatingModel}</div><div className="mt-4 grid gap-3 md:grid-cols-4">{[["1",t.inbox,t.followup,"/admin/requests"],["2",t.journeyFile,t.customerBooking,"/admin/journeys"],["3",t.operationsLabel,t.readiness,"/admin/operations"],["4",t.management,t.financeTeam,"/admin/team"]].map(([n,k,d,h])=><Link href={h} key={k} className="rounded-xl bg-[#f7f3ea] p-5 hover:bg-white"><div className="text-xs font-bold text-gold">{n}</div><div className="mt-2 font-semibold text-forest">{k}</div><div className="mt-1 text-xs text-forest/50">{d}</div></Link>)}</div></div>
 </div></section>
}