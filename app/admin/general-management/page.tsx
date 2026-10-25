import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

export default async function GeneralManagementOverview(){
 const staff=await getCurrentStaff();
 if(!staff)redirect('/admin/login');
 if(staff.profile.role!=='SUPER_ADMIN')redirect('/admin');
 const s=getSupabaseAdmin();
 const now=new Date().toISOString();
 const [requests, familyRequests, newFamilyRequests, bookings, tasks, vendor, support, urgentSupport, overdueSupport, groups]=await Promise.all([
  s.from('journey_requests').select('id,status',{count:'exact',head:true}),
  s.from('family_friends_quote_requests').select('id',{count:'exact',head:true}),
  s.from('family_friends_quote_requests').select('id',{count:'exact',head:true}).eq('status','NEW'),
  s.from('bookings').select('id,status',{count:'exact',head:true}),
  s.from('operations_tasks').select('id',{count:'exact',head:true}).not('status','in','("COMPLETED","CLOSED","CANCELLED","VERIFIED")'),
  s.from('operations_booking_requests').select('id',{count:'exact',head:true}).in('status',['REQUESTED','QUOTED','NEEDS_INFO']),
  s.from('guest_support_cases').select('id',{count:'exact',head:true}).not('status','in','("RESOLVED","CLOSED")'),
  s.from('guest_support_cases').select('id',{count:'exact',head:true}).in('priority',['HIGH','URGENT']).not('status','in','("RESOLVED","CLOSED")'),
  s.from('guest_support_cases').select('id',{count:'exact',head:true}).lt('follow_up_at',now).not('status','in','("RESOLVED","CLOSED")'),
  s.from('groups').select('id,status',{count:'exact',head:true})
 ]);
 const queryErrors=[requests.error,familyRequests.error,newFamilyRequests.error,bookings.error,tasks.error,vendor.error,support.error,urgentSupport.error,overdueSupport.error,groups.error].filter(Boolean);
 const metric=(value:number|null|undefined,error:unknown)=>error?'—':(value??0);
 const cards=[
  {title:'طلبات الرحلات',value:metric(requests.count,requests.error),href:'/admin/requests'},
  {title:'طلبات العائلات والأصدقاء',value:metric(familyRequests.count,familyRequests.error),href:'/admin/family-friends',detail:newFamilyRequests.error?'تعذر تحميل عدد الطلبات الجديدة':`منها ${newFamilyRequests.count??0} طلب جديد`},
  {title:'الحجوزات',value:metric(bookings.count,bookings.error),href:'/admin/bookings'},
  {title:'المجموعات',value:metric(groups.count,groups.error),href:'/admin/groups'},
  {title:'المهام التشغيلية المفتوحة',value:tasks.error?'—':(tasks.count??0),href:'/admin/operations'},
  {title:'طلبات الموردين التي تحتاج إجراء',value:vendor.error?'—':(vendor.count??0),href:'/admin/operations-booking-requests'},
  {title:'حالات الضيوف المفتوحة',value:support.error?'—':(support.count??0),href:'/admin/guest-care'}
 ];
 return <section className="pb-12">
  <div className="eyebrow">GENERAL MANAGEMENT · RESULTS & DECISIONS</div>
  <h1 className="serif mt-2 text-4xl text-forest">نتائج الإدارة العامة والقرارات</h1>
  <p className="mt-2 max-w-3xl text-sm text-forest/60">لوحة موحدة لمتابعة الطلبات والحجوزات والتشغيل والقضايا التي تتطلب قرارًا إداريًا. الأرقام مأخوذة من السجلات الحالية ولا يتم افتراض بيانات غير مسجلة.</p>
  {queryErrors.length>0&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">تعذر تحميل بعض المؤشرات. تظهر علامة (—) للمؤشر الذي تعذر تحميله؛ لا يُعرض الخطأ على أنه صفر.</p>}
  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(x=><Link key={x.title} href={x.href} className="card p-5 transition hover:border-gold/50"><div className="text-sm text-forest/60">{x.title}</div><div className="serif mt-2 text-4xl text-forest">{x.value}</div>{'detail' in x&&<div className="mt-2 text-xs text-forest/60">{x.detail}</div>}<div className="mt-3 text-xs font-semibold text-gold">عرض التفاصيل ←</div></Link>)}</div>
  <div className="mt-6 grid gap-4 lg:grid-cols-2">
   <div className="card p-5"><h2 className="serif text-2xl">قرارات ومتابعات مطلوبة</h2><div className="mt-4 divide-y divide-forest/10">{[{label:'حالات ضيوف بأولوية عالية أو عاجلة',value:urgentSupport.error?'—':(urgentSupport.count??0),href:'/admin/guest-care'},{label:'متابعات ضيوف حان موعدها أو تجاوزته',value:overdueSupport.error?'—':(overdueSupport.count??0),href:'/admin/guest-care'},{label:'مهام تشغيلية مفتوحة',value:tasks.error?'—':(tasks.count??0),href:'/admin/operations'},{label:'طلبات موردين لم تُحسم بعد',value:vendor.error?'—':(vendor.count??0),href:'/admin/operations-booking-requests'},{label:'طلبات عائلات وأصدقاء جديدة',value:newFamilyRequests.error?'—':(newFamilyRequests.count??0),href:'/admin/family-friends'}].map(x=><Link key={x.label} href={x.href} className="flex items-center justify-between gap-3 py-3"><span className="text-sm">{x.label}</span><span className="rounded-lg bg-[#f7f3ea] px-3 py-1 text-sm font-semibold">{x.value}</span></Link>)}</div></div>
   <div className="card p-5"><h2 className="serif text-2xl">المسارات الإدارية</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['الفريق والصلاحيات','/admin/team'],['مراقبة الموظفين','/admin/staff-monitoring'],['سجل التدقيق','/admin/audit-logs'],['المركز المالي','/admin/finance'],['إشراف العمليات','/admin/operations-supervision'],['التقارير','/admin/reports']].map(x=><Link key={x[0]} href={x[1]} className="rounded-lg border border-forest/10 p-3 text-sm font-semibold hover:bg-[#f7f3ea]">{x[0]} ↗</Link>)}</div><p className="mt-4 text-xs text-forest/50">الاعتماد المالي والصلاحيات الحساسة تبقى مقيدة بالأدوار المخولة.</p></div>
  </div>
 </section>;
}
