import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import Link from 'next/link';
import { BookingStatusForm } from '@/components/admin/BookingStatusForm';
import { getAdminLocale } from '@/lib/admin-locale';
import JourneyFinancials from '@/components/admin/JourneyFinancials';

export default async function JourneyFile({params}:{params:Promise<{id:string}>}){
  const staff=await getCurrentStaff(); if(!staff)return null;
  const locale=await getAdminLocale();
  const {id}=await params;
  const s=getSupabaseAdmin();
  const {data:row,error}=await s.from('bookings').select('id,booking_id,guest_count,group_matching_status,total_amount,currency,status,payment_status,lead_source,expected_travel_date,expected_period_start,expected_period_end,notes,created_at,customers(full_name,country,city,whatsapp,email,preferred_language),packages(name,slug,positioning)').eq('id',id).single();
  if(error||!row)return <section className="pb-12"><div className="card p-10"><h1 className="serif text-3xl text-forest">لم يتم العثور على الرحلة</h1><Link className="btn btn-outline mt-6" href="/admin/journeys">العودة إلى الرحلات</Link></div></section>;
  const customer=(Array.isArray(row.customers)?row.customers[0]:row.customers) as {full_name?:string;country?:string;city?:string;whatsapp?:string;email?:string;preferred_language?:string}|null;
  const pkg=(Array.isArray(row.packages)?row.packages[0]:row.packages) as {name?:string;slug?:string;positioning?:string}|null;
  const role=staff.profile.role;
  const canViewFinancial=role==='SUPER_ADMIN'||role==='FINANCE'||role==='ADMIN';
  const canEditJourneyCosts=['SUPER_ADMIN','FINANCE','ADMIN','OPERATIONS_MANAGER','OPERATIONS'].includes(role);
  const {data:journeyCosts}=canEditJourneyCosts||canViewFinancial?await s.from('journey_costs').select('id,category,description,quantity,amount,currency,amount_usd,cost_stage,date,supplier_id,notes').eq('booking_id',row.id).order('date',{ascending:false}):{data:[]};
  const canUpdateStatus=['SUPER_ADMIN','ADMIN','SALES','FINANCE','OPERATIONS_MANAGER','OPERATIONS'].includes(role);
  const period=row.expected_travel_date||row.expected_period_start||(row.expected_period_end?((locale==='ar'?'حتى ':'Until ')+row.expected_period_end):(locale==='ar'?'غير محدد':'Not set'));
  const stage=['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED'].indexOf(row.status);
  const stages=locale==='ar'?['طلب','المبيعات','التفاصيل','الدفع','تم التحقق','مؤكد','التجهيز','نشطة','مكتملة']:['Request','Sales','Details','Payment','Verified','Confirmed','Preparing','Active','Completed'];
  const needsMatching=Number(row.guest_count)<5 && row.group_matching_status!=='GROUPED';
  return <section className="pb-12">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><Link href="/admin/journeys" className="text-sm font-semibold text-gold">← جميع الرحلات</Link><div className="eyebrow mt-5">{row.booking_id}</div><h1 className="serif mt-2 text-5xl text-forest">{customer?.full_name||'عميل بدون اسم'}</h1><p className="mt-2 text-forest/55">{pkg?.name||'—'} · {row.guest_count} {locale==='ar'?'ضيوف':'guests'} · {period}</p></div>
      {canUpdateStatus&&<BookingStatusForm bookingId={row.id} currentStatus={row.status} paymentStatus={row.payment_status}/>}
    </div>
    {needsMatching&&<div className="mt-6 rounded-2xl border border-gold/40 bg-[#fffaf0] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow text-gold">تجميع المجموعة</div>
          <h2 className="mt-2 text-xl font-semibold text-forest">يحتاج ضمًا إلى مجموعة</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-forest/65">هذا الطلب يحتوي على {row.guest_count} {row.guest_count===1?'ضيف':'ضيوف'} فقط، بينما السعة التشغيلية المستهدفة للمجموعة تصل إلى 8 ضيوف. لا يحتاج العميل إلى إجراء إضافي؛ على فريق العمليات مطابقة هذا الحجز مع حجوزات متوافقة.</p>
        </div>
        <Link href="/admin/groups" className="btn btn-primary shrink-0">فتح التجميع الذكي</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-white px-3 py-2 text-forest">الحالة: {row.group_matching_status||'NEEDS_MATCHING'}</span>
        <span className="rounded-full bg-white px-3 py-2 text-forest">المجموعة: حتى 8 ضيوف</span>
      </div>
    </div>}
    <div className="card mt-8 overflow-x-auto p-5"><div className="flex min-w-[760px] items-center gap-2">{stages.map((x,i)=><div key={x} className="flex flex-1 items-center gap-2"><div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold '+(i<=stage?'bg-forest text-white':'bg-[#f7f3ea] text-forest/35')}>{i+1}</div><div className={'text-xs font-semibold '+(i<=stage?'text-forest':'text-forest/35')}>{x}</div>{i<stages.length-1&&<div className={'h-px flex-1 '+(i<stage?'bg-gold':'bg-forest/10')}/>}</div>)}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <div className="grid gap-6">
        <div className="card p-6"><div className="eyebrow">العميل</div><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><div className="text-xs text-forest/40">الاسم</div><div className="mt-1 font-semibold text-forest">{customer?.full_name||'—'}</div></div><div><div className="text-xs text-forest/40">واتساب</div><div className="mt-1 font-semibold text-forest">{customer?.whatsapp||'—'}</div></div><div><div className="text-xs text-forest/40">الدولة / المدينة</div><div className="mt-1 font-semibold text-forest">{customer?.country||'—'} {customer?.city?'· '+customer.city:''}</div></div><div><div className="text-xs text-forest/40">اللغة</div><div className="mt-1 font-semibold uppercase text-forest">{customer?.preferred_language||'—'}</div></div></div></div>
        <div className="card p-6"><div className="eyebrow">تفاصيل الرحلة</div><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><div className="text-xs text-forest/40">الباقة</div><div className="mt-1 text-xl font-semibold text-forest">{pkg?.name||'—'}</div></div><div><div className="text-xs text-forest/40">السفر المتوقع</div><div className="mt-1 font-semibold text-forest">{period}</div></div><div><div className="text-xs text-forest/40">الضيوف</div><div className="mt-1 font-semibold text-forest">{row.guest_count}</div></div><div><div className="text-xs text-forest/40">الملاحظات</div><div className="mt-1 text-sm leading-6 text-forest/65">{row.notes||'لا توجد ملاحظات حتى الآن.'}</div></div></div></div>
        {canViewFinancial&&<JourneyFinancials bookingId={row.id} revenue={Number(row.total_amount)} guestCount={Number(row.guest_count)} costs={journeyCosts||[]} canEdit={canEditJourneyCosts}/>}
        <div className="card p-6"><div className="eyebrow">جاهزية التشغيل</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">الفنادق</b><div className="mt-1 text-xs text-forest/50">افتح العمليات لتأكيد فنادق مكة والمدينة.</div></div><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">النقل</b><div className="mt-1 text-xs text-forest/50">التنقلات والمركبات.</div></div><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">القطار</b><div className="mt-1 text-xs text-forest/50">قطار الحرمين عند الحاجة.</div></div><div className="rounded-xl bg-[#f7f3ea] p-4"><b className="text-forest">الزيارات / المضيف</b><div className="mt-1 text-xs text-forest/50">التعيينات والجاهزية.</div></div></div><Link href="/admin/operations" className="btn btn-outline mt-5">فتح مركز التحكم بالعمليات</Link></div>
      </div>
      <div className="grid h-fit gap-6">
        {canViewFinancial&&<div className="card p-6"><div className="eyebrow">المالية</div><div className="mt-4"><div className="text-xs text-forest/40">قيمة الرحلة</div><div className="serif mt-1 text-4xl text-forest">$ {Number(row.total_amount).toLocaleString()}</div><div className="mt-4 flex items-center justify-between border-t border-forest/10 pt-4"><span className="text-sm text-forest/55">الدفع</span><span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{row.payment_status.replaceAll('_',' ')}</span></div></div><Link href="/admin/payments" className="btn btn-outline mt-5 w-full">فتح المدفوعات</Link></div>}
        <div className="card p-6"><div className="eyebrow">التواصل</div><p className="mt-4 text-sm leading-6 text-forest/60">احتفظ بتواصل العميل مرتبطًا بالرحلة حتى ترى المبيعات والعمليات السياق نفسه.</p>{customer?.whatsapp&&<a className="btn btn-primary mt-5 w-full" href={'https://wa.me/'+customer.whatsapp.replace(/[^0-9]/g,'')} target="_blank" rel="noreferrer">فتح واتساب</a>}</div>
      </div>
    </div>
  </section>
}