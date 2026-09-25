import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import Link from 'next/link';
import { BookingStatusForm } from '@/components/admin/BookingStatusForm';

export default async function JourneyFile({params}:{params:Promise<{id:string}>}){
  const staff=await getCurrentStaff(); if(!staff)return null;
  const {id}=await params;
  const s=getSupabaseAdmin();
  const {data:row,error}=await s.from('bookings').select('id,booking_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,notes,created_at,customers(full_name,country,city,whatsapp,email,preferred_language),packages(name,slug,positioning)').eq('id',id).single();
  if(error||!row)return <section classالاسم="pb-12"><div classالاسم="card p-10"><h1 classالاسم="serif text-3xl text-forest">لم يتم العثور على الرحلة</h1><Link classالاسم="btn btn-outline mt-6" href="/admin/journeys">العودة إلى الرحلات</Link></div></section>;
  const customer=(Array.isArray(row.customers)?row.customers[0]:row.customers) as {full_name?:string;country?:string;city?:string;whatsapp?:string;email?:string;preferred_language?:string}|null;
  const pkg=(Array.isArray(row.packages)?row.packages[0]:row.packages) as {name?:string;slug?:string;positioning?:string}|null;
  const role=staff.profile.role;
  const canViewالمالية=role==='SUPER_ADMIN'||role==='FINANCE';
  const canUpdateStatus=['SUPER_ADMIN','ADMIN','SALES','FINANCE','OPERATIONS_MANAGER','OPERATIONS'].includes(role);
  const period=row.expected_travel_date||row.expected_period_start||(row.expected_period_end?((locale==='ar'?'حتى ':'Until ')+row.expected_period_end):(locale==='ar'?'غير محدد':locale==='ar'?'غير محدد':'Not set'));
  const stage=['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED'].indexOf(row.status);
  const stages=[(locale==='ar'?['طلب','المبيعات','التفاصيل','الدفع','تم التحقق','مؤكد','التجهيز','نشطة','مكتملة']:['Request','Sales','Details','الدفع','Verified','Confirmed','Preparing','Active','Completed'])];
  return <section classالاسم="pb-12">
    <div classالاسم="flex flex-wrap items-start justify-between gap-5">
      <div><Link href="/admin/journeys" classالاسم="text-sm font-semibold text-gold">← جميع الرحلات</Link><div classالاسم="eyebrow mt-5">{row.booking_id}</div><h1 classالاسم="serif mt-2 text-5xl text-forest">{customer?.full_name||'عميل بدون اسم'}</h1><p classالاسم="mt-2 text-forest/55">{pkg?.name||'—'} · {row.guest_count} guests · {period}</p></div>
      {canUpdateStatus&&<BookingStatusForm bookingId={row.id} currentStatus={row.status} paymentStatus={row.payment_status}/>} 
    </div>
    <div classالاسم="card mt-8 overflow-x-auto p-5"><div classالاسم="flex min-w-[760px] items-center gap-2">{stages.map((x,i)=><div key={x} classالاسم="flex flex-1 items-center gap-2"><div classالاسم={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold '+(i<=stage?'bg-forest text-white':'bg-[#f7f3ea] text-forest/35')}>{i+1}</div><div classالاسم={'text-xs font-semibold '+(i<=stage?'text-forest':'text-forest/35')}>{x}</div>{i<stages.length-1&&<div classالاسم={'h-px flex-1 '+(i<stage?'bg-gold':'bg-forest/10')}/>}</div>)}</div></div>
    <div classالاسم="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <div classالاسم="grid gap-6">
        <div classالاسم="card p-6"><div classالاسم="eyebrow">العميل</div><div classالاسم="mt-4 grid gap-5 sm:grid-cols-2"><div><div classالاسم="text-xs text-forest/40">الاسم</div><div classالاسم="mt-1 font-semibold text-forest">{customer?.full_name||'—'}</div></div><div><div classالاسم="text-xs text-forest/40">واتساب</div><div classالاسم="mt-1 font-semibold text-forest">{customer?.whatsapp||'—'}</div></div><div><div classالاسم="text-xs text-forest/40">الدولة / المدينة</div><div classالاسم="mt-1 font-semibold text-forest">{customer?.country||'—'} {customer?.city?'· '+customer.city:''}</div></div><div><div classالاسم="text-xs text-forest/40">اللغة</div><div classالاسم="mt-1 font-semibold uppercase text-forest">{customer?.preferred_language||'—'}</div></div></div></div>
        <div classالاسم="card p-6"><div classالاسم="eyebrow">تفاصيل الرحلة</div><div classالاسم="mt-4 grid gap-5 sm:grid-cols-2"><div><div classالاسم="text-xs text-forest/40">الباقة</div><div classالاسم="mt-1 text-xl font-semibold text-forest">{pkg?.name||'—'}</div></div><div><div classالاسم="text-xs text-forest/40">السفر المتوقع</div><div classالاسم="mt-1 font-semibold text-forest">{period}</div></div><div><div classالاسم="text-xs text-forest/40">الضيوف</div><div classالاسم="mt-1 font-semibold text-forest">{row.guest_count}</div></div><div><div classالاسم="text-xs text-forest/40">الملاحظات</div><div classالاسم="mt-1 text-sm leading-6 text-forest/65">{row.notes||'لا توجد ملاحظات حتى الآن.'}</div></div></div></div>
        <div classالاسم="card p-6"><div classالاسم="eyebrow">جاهزية التشغيل</div><div classالاسم="mt-5 grid gap-3 sm:grid-cols-2"><div classالاسم="rounded-xl bg-[#f7f3ea] p-4"><b classالاسم="text-forest">الفنادق</b><div classالاسم="mt-1 text-xs text-forest/50">افتح العمليات لتأكيد فنادق مكة والمدينة.</div></div><div classالاسم="rounded-xl bg-[#f7f3ea] p-4"><b classالاسم="text-forest">النقل</b><div classالاسم="mt-1 text-xs text-forest/50">التنقلات والمركبات.</div></div><div classالاسم="rounded-xl bg-[#f7f3ea] p-4"><b classالاسم="text-forest">القطار</b><div classالاسم="mt-1 text-xs text-forest/50">Haramain القطار where applicable.</div></div><div classالاسم="rounded-xl bg-[#f7f3ea] p-4"><b classالاسم="text-forest">الزيارات / المضيف</b><div classالاسم="mt-1 text-xs text-forest/50">التعيينات والجاهزية.</div></div></div><Link href="/admin/operations" classالاسم="btn btn-outline mt-5">فتح مركز التحكم بالعمليات</Link></div>
      </div>
      <div classالاسم="grid h-fit gap-6">
        {canViewالمالية&&<div classالاسم="card p-6"><div classالاسم="eyebrow">المالية</div><div classالاسم="mt-4"><div classالاسم="text-xs text-forest/40">قيمة الرحلة</div><div classالاسم="serif mt-1 text-4xl text-forest">$ {Number(row.total_amount).toLocaleString()}</div><div classالاسم="mt-4 flex items-center justify-between border-t border-forest/10 pt-4"><span classالاسم="text-sm text-forest/55">الدفع</span><span classالاسم="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{row.payment_status.replaceAll('_',' ')}</span></div></div><Link href="/admin/payments" classالاسم="btn btn-outline mt-5 w-full">فتح المدفوعات</Link></div>}
        <div classالاسم="card p-6"><div classالاسم="eyebrow">التواصل</div><p classالاسم="mt-4 text-sm leading-6 text-forest/60">احتفظ بتواصل العميل مرتبطًا بالرحلة حتى ترى المبيعات والعمليات السياق نفسه.</p>{customer?.whatsapp&&<a classالاسم="btn btn-primary mt-5 w-full" href={'https://wa.me/'+customer.whatsapp.replace(/[^0-9]/g,'')} target="_blank" rel="noreferrer">Open واتساب</a>}</div>
      </div>
    </div>
  </section>
}