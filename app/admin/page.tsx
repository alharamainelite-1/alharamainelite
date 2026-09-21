import Link from "next/link";
import {getSupabaseAdmin} from "@/lib/supabase/server";
import {getCurrentStaff} from "@/lib/supabase/auth";

export default async function AdminHome(){
 const staff=await getCurrentStaff(); if(!staff)return null;
 const role=staff.profile.role; let stats={requests:0,active:0,pendingPayments:0,completed:0,overdue:0,revenue:0}; let recent:any[]=[]; let error="";
 try{
  const s=getSupabaseAdmin();
  const [r,a,p,d,t,pay,j]=await Promise.all([s.from("journey_requests").select("*",{count:"exact",head:true}),s.from("bookings").select("*",{count:"exact",head:true}).in("status",["CONFIRMED","PREPARING","ACTIVE"]),s.from("bookings").select("*",{count:"exact",head:true}).in("payment_status",["PAYMENT_INSTRUCTIONS_SENT","PENDING_VERIFICATION"]),s.from("bookings").select("*",{count:"exact",head:true}).eq("status","COMPLETED"),s.from("operations_tasks").select("*",{count:"exact",head:true}).in("status",["OVERDUE","DELAYED"]),s.from("payments").select("amount,status"),s.from("bookings").select("id,booking_id,status,payment_status,total_amount,guest_count,created_at,customers(full_name),packages(name)").order("created_at",{ascending:false}).limit(6)]);
  if([r,a,p,d,t,pay,j].some(x=>x.error))throw new Error("Unable to load live dashboard data.");
  stats={requests:r.count||0,active:a.count||0,pendingPayments:p.count||0,completed:d.count||0,overdue:t.count||0,revenue:((pay.data||[]) as any[]).filter(x=>x.status==="RECEIVED").reduce((n,x)=>n+Number(x.amount),0)}; recent=j.data||[];
 }catch(e){error=e instanceof Error?e.message:"Unable to load dashboard."}
 const isSales=role==="SALES"; const isOps=role==="OPERATIONS_MANAGER"||role==="OPERATIONS";
 const title=isSales?"Sales workspace":isOps?"Operations workspace":"Executive workspace";
 const intro=isSales?"Work the customer journey from first request to confirmed handover.":isOps?"Prepare every confirmed journey and keep the next operational action visible.":"See what needs attention across sales, payments and upcoming journeys.";
 return <section className="pb-12"><div className="container">
  <div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-2 text-5xl text-forest">{title}</h1><p className="mt-3 max-w-2xl text-forest/55">{intro}</p></div><Link href="/admin/journeys" className="btn btn-primary">Open journeys</Link></div>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   <Link href="/admin/requests" className="card p-6 hover:border-gold/50"><div className="eyebrow">New requests</div><div className="serif mt-2 text-4xl text-forest">{stats.requests}</div><div className="mt-2 text-xs text-forest/45">Start the customer conversation →</div></Link>
   <Link href="/admin/journeys" className="card p-6 hover:border-gold/50"><div className="eyebrow">Active journeys</div><div className="serif mt-2 text-4xl text-forest">{stats.active}</div><div className="mt-2 text-xs text-forest/45">Open journey workspace →</div></Link>
   <Link href="/admin/payments" className="card p-6 hover:border-gold/50"><div className="eyebrow">Payment actions</div><div className="serif mt-2 text-4xl text-forest">{stats.pendingPayments}</div><div className="mt-2 text-xs text-forest/45">Verify or follow up →</div></Link>
   <Link href="/admin/operations" className="card p-6 hover:border-gold/50"><div className="eyebrow">Operational issues</div><div className="serif mt-2 text-4xl text-forest">{stats.overdue}</div><div className="mt-2 text-xs text-forest/45">Open operations →</div></Link>
  </div>
  <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
   <div className="card p-6"><div className="flex items-end justify-between"><div><div className="eyebrow">Journey queue</div><h2 className="serif mt-2 text-3xl text-forest">Recent journeys</h2></div><Link href="/admin/journeys" className="text-sm font-semibold text-gold">View all →</Link></div>
    <div className="mt-5 grid gap-3">{recent.length===0?<div className="rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/50">No journeys yet.</div>:recent.map(r=><Link key={r.id} href={"/admin/journeys/"+r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-forest/10 p-4 hover:border-gold/50"><div><div className="text-xs font-semibold text-gold">{r.booking_id}</div><div className="mt-1 font-semibold text-forest">{r.customers?.full_name||"Unnamed customer"}</div><div className="mt-1 text-xs text-forest/45">{r.packages?.name||"—"} · {r.guest_count} guests</div></div><div className="text-right"><div className="text-sm font-semibold text-forest">${Number(r.total_amount).toLocaleString()}</div><div className="mt-1 rounded-full bg-[#f7f3ea] px-3 py-1 text-[11px] font-semibold text-forest">{r.status.replaceAll("_"," ")}</div></div></Link>)}</div>
   </div>
   <div className="grid gap-6">
    <div className="card p-6"><div className="eyebrow">Needs attention</div><div className="mt-4 grid gap-3">{stats.pendingPayments>0&&<Link href="/admin/payments" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="font-semibold text-forest">{stats.pendingPayments} payment action{stats.pendingPayments===1?"":"s"}</div><div className="mt-1 text-xs text-forest/55">Review payment status.</div></Link>}{stats.overdue>0&&<Link href="/admin/operations" className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="font-semibold text-forest">{stats.overdue} operational issue{stats.overdue===1?"":"s"}</div><div className="mt-1 text-xs text-forest/55">Resolve delayed or overdue tasks.</div></Link>}{stats.pendingPayments===0&&stats.overdue===0&&<div className="rounded-xl bg-[#f7f3ea] p-4 text-sm text-forest/55">Nothing urgent right now.</div>}</div></div>
    <div className="card p-6"><div className="eyebrow">Business snapshot</div><div className="mt-4 grid gap-4"><div className="flex justify-between border-b border-forest/10 pb-3"><span className="text-sm text-forest/55">Payments received</span><b className="text-forest">USD {stats.revenue.toLocaleString()}</b></div><div className="flex justify-between"><span className="text-sm text-forest/55">Completed journeys</span><b className="text-forest">{stats.completed}</b></div></div></div>
   </div>
  </div>
  <div className="mt-8 card p-6"><div className="eyebrow">Your operating model</div><div className="mt-4 grid gap-3 md:grid-cols-4">{[["1","INBOX","Requests & follow-up","/admin/requests"],["2","JOURNEYS","Customer + booking file","/admin/journeys"],["3","OPERATIONS","Readiness & resources","/admin/operations"],["4","MANAGEMENT","Finance, reports & team","/admin/team"]].map(([n,k,d,h])=><Link href={h} key={k} className="rounded-xl bg-[#f7f3ea] p-5 hover:bg-white"><div className="text-xs font-bold text-gold">{n}</div><div className="mt-2 font-semibold text-forest">{k}</div><div className="mt-1 text-xs text-forest/50">{d}</div></Link>)}</div></div>
 </div></section>
}