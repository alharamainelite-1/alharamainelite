import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';

type PaymentRow={amount:number|string;status:string};

export default async function AdminHome(){
 const staff=await getCurrentStaff();
 if(!staff)return null;
 const role=staff.profile.role;
 let stats={requests:0,pending:0,confirmed:0,active:0,revenue:0,pendingPayments:0,completed:0,overdueTasks:0};
 let setup=false;
 try{
  const s=getSupabaseAdmin();
  const [r,p,c,a,pay,done,tasks]=await Promise.all([
   s.from('journey_requests').select('*',{count:'exact',head:true}),
   s.from('bookings').select('*',{count:'exact',head:true}).eq('payment_status','PAYMENT_PENDING'),
   s.from('bookings').select('*',{count:'exact',head:true}).eq('status','CONFIRMED'),
   s.from('bookings').select('*',{count:'exact',head:true}).eq('status','ACTIVE'),
   s.from('payments').select('amount,status'),
   s.from('bookings').select('*',{count:'exact',head:true}).eq('status','COMPLETED'),
   s.from('operations_tasks').select('*',{count:'exact',head:true}).in('status',['OVERDUE','DELAYED'])
  ]);
  if([r,p,c,a,pay,done,tasks].some(x=>x.error))throw new Error('Unable to load dashboard data.');
  stats.requests=r.count||0; stats.pending=p.count||0; stats.confirmed=c.count||0; stats.active=a.count||0; stats.completed=done.count||0; stats.overdueTasks=tasks.count||0;
  stats.revenue=((pay.data||[]) as PaymentRow[]).filter(x=>x.status==='RECEIVED').reduce((n,x)=>n+Number(x.amount),0);
  stats.pendingPayments=((pay.data||[]) as PaymentRow[]).filter(x=>x.status==='PENDING_VERIFICATION').reduce((n,x)=>n+Number(x.amount),0);
 }catch{setup=true}

 const isSales=role==='SALES';
 const isOps=role==='OPERATIONS_MANAGER'||role==='OPERATIONS';
 const title=isSales?'Sales & Booking Workspace':isOps?'Operations Control Centre':'Executive Dashboard';
 const intro=isSales?'Manage leads, customer follow-up, booking readiness and handover to operations.':isOps?'Manage operational tasks, suppliers, resources and journey readiness.':'Monitor the business, approve exceptions and see what needs attention.';
 const attention=[
  stats.overdueTasks>0?{label:'Overdue operational tasks',value:stats.overdueTasks,href:'/admin/operations'}:null,
  stats.pending>0?{label:'Payments pending',value:stats.pending,href:'/admin/payments'}:null,
  stats.requests>0&&isSales?{label:'New journey requests',value:stats.requests,href:'/admin/requests'}:null
 ].filter(Boolean) as {label:string;value:number;href:string}[];

 return <section className="section"><div className="container">
  <div className="flex flex-wrap items-end justify-between gap-5">
   <div><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-3 text-5xl text-forest">{title}</h1><p className="mt-3 max-w-2xl text-forest/55">{intro}</p></div>
   <Link href="/" className="btn btn-outline">View website</Link>
  </div>
  {setup&&<div className="mt-8 border border-gold/40 bg-[#fffaf0] p-5 text-sm leading-6 text-forest/70"><b className="text-forest">Live data is not available.</b> Check the production Supabase environment and migration.</div>}
  <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   {[
    ['New Requests',stats.requests,'/admin/requests'],
    ['Payment Pending',stats.pending,'/admin/payments'],
    ['Confirmed',stats.confirmed,'/admin/bookings'],
    ['Active Journeys',stats.active,'/admin/bookings']
   ].map(([label,value,href])=><Link href={href as string} className="card p-6 transition hover:-translate-y-0.5 hover:border-gold/60" key={label as string}><div className="eyebrow">{label as string}</div><div className="serif mt-3 text-4xl text-forest">{value as number}</div></Link>)}
  </div>
  <div className="mt-5 grid gap-4 md:grid-cols-3">
   <div className="card p-6"><div className="eyebrow">Payments received</div><div className="serif mt-3 text-4xl text-forest">{'USD '+stats.revenue.toLocaleString()}</div></div>
   <div className="card p-6"><div className="eyebrow">Pending verification</div><div className="serif mt-3 text-4xl text-forest">{'USD '+stats.pendingPayments.toLocaleString()}</div></div>
   <div className="card p-6"><div className="eyebrow">Completed journeys</div><div className="serif mt-3 text-4xl text-forest">{stats.completed}</div></div>
  </div>
  <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
   <div className="card p-6"><div className="eyebrow">Needs attention</div><div className="mt-4 grid gap-3">
    {attention.length===0?<div className="rounded-xl bg-[#f7f3ea] p-4 text-sm text-forest/55">Nothing urgent right now.</div>:attention.map(x=><Link key={x.href+x.label} href={x.href} className="flex items-center justify-between rounded-xl border border-forest/10 p-4 hover:border-gold/50"><span className="text-sm font-medium text-forest">{x.label}</span><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-sm font-semibold text-forest">{x.value}</span></Link>)}
   </div></div>
   <div className="card p-6"><div className="eyebrow">Operating model</div><div className="mt-4 grid gap-3 text-sm text-forest/70">
    <div><b className="text-forest">Sales & Booking</b> owns the customer relationship and prepares the booking file.</div>
    <div><b className="text-forest">Operations</b> owns hotels, transport, train, hosts and journey readiness.</div>
    <div><b className="text-forest">General Management</b> owns business decisions and exceptions.</div>
   </div></div>
  </div>
  <div className="mt-8 card p-6"><div className="eyebrow">Handover workflow</div><div className="mt-4 grid gap-3 md:grid-cols-5">
   {['Customer','Booking Ready','Handover','Operations','Journey Ready'].map((x,i)=><div key={x} className="rounded-xl bg-[#f7f3ea] p-4 text-center"><div className="text-xs font-semibold text-gold">{i+1}</div><div className="mt-1 text-sm font-medium text-forest">{x}</div></div>)}
  </div></div>
 </div></section>
}
