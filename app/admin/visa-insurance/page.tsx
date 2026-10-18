import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {VisaInsuranceStatusForm} from '@/components/admin/VisaInsuranceStatusForm';
import {getAdminLocale} from '@/lib/admin-locale';
import {redirect} from 'next/navigation';
const ROLES=['SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES'];
const statusAr:Record<string,string>={NEW_REQUEST:'طلب جديد',CONTACTED:'تم التواصل',DETAILS_PENDING:'بانتظار التفاصيل',PAYMENT_PENDING:'بانتظار الدفع',PAYMENT_RECEIVED:'تم استلام الدفع',CONFIRMED:'مؤكد',PREPARING:'قيد التجهيز',ACTIVE:'نشطة',COMPLETED:'مكتملة',CANCELLED:'ملغاة'};
export default async function VisaInsurancePage(){
 const staff=await getCurrentStaff();if(!staff)redirect('/admin/login');if(!ROLES.includes(staff.profile.role))return <section className="card p-8">غير مصرح بالوصول إلى هذه الصفحة.</section>;
 const locale=await getAdminLocale();const ar=locale==='ar';
 const s=getSupabaseAdmin();
 const {data:bookings,error}=await s.from('bookings').select('id,booking_id,guest_count,status,expected_travel_date,expected_period_start,expected_period_end,customers(full_name,country)').is('archived_at',null).order('created_at',{ascending:false}).limit(200);
 const ids=(bookings||[]).map(b=>b.id);
 const {data:travel,error:travelError}=ids.length?await s.from('booking_travel_admin').select('*').in('booking_id',ids):{data:[],error:null} as any;
 const travelMap=new Map<string,any>();(travel||[]).forEach((x:any)=>travelMap.set(x.booking_id,x));
 const date=(value:string)=>{if(!value)return '';const d=new Date(value+'T00:00:00');return Number.isNaN(d.getTime())?value:d.toLocaleDateString(ar?'ar-SA':'en-GB')};
 return <section dir={ar?'rtl':'ltr'} lang={locale} className="pb-12"><div className="eyebrow">{ar?'خدمات الضيوف':'Guest Services'}</div><h1 className="serif mt-2 text-4xl text-forest">{ar?'التأشيرات والتأمين الصحي':'Visa & Health Insurance'}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-forest/60">{ar?'تابع حالة التأشيرة السعودية والتأمين الصحي للسفر لكل حجز. تُجمع بيانات الضيوف بشكل منفصل أثناء المتابعة. لا تُدخل أرقام جوازات السفر أو ترفع وثائق الهوية هنا.':'Track visa and travel health insurance progress for each booking. Collect guest details separately during follow-up; do not enter passport numbers or upload identity documents here.'}</p>
 {(error||travelError)&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{ar?'تعذّر تحميل جميع السجلات. تحقق من تطبيق تحديث قاعدة بيانات متابعة التأشيرات والتأمين.':'Unable to load all records. Check that the travel tracking migration has been applied.'}</div>}
 <div className="mt-6 grid gap-4">{!bookings?.length?<div className="card p-8 text-center text-forest/50">{ar?'لا توجد حجوزات نشطة.':'No active bookings found.'}</div>:bookings.map((b:any)=><article key={b.id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold tracking-wider text-gold">{ar?'رقم الحجز: ':''}{b.booking_id}</div><h2 className="mt-1 text-lg font-semibold text-forest">{b.customers?.full_name||(ar?'اسم العميل غير متوفر':'Customer name pending')}</h2><p className="mt-1 text-xs text-forest/50">{[b.customers?.country,ar?(statusAr[b.status]||b.status?.replaceAll('_',' ')):b.status?.replaceAll('_',' ')].filter(Boolean).join(' · ')}</p></div><div className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs text-forest">{date(b.expected_travel_date)||[date(b.expected_period_start),date(b.expected_period_end)].filter(Boolean).join(' – ')||(ar?'موعد السفر غير محدد':'Travel date pending')} · {b.guest_count} {ar?'ضيوف':'guest(s)'}</div></div>
 <VisaInsuranceStatusForm bookingId={b.id} initial={travelMap.get(b.id)||null} locale={locale}/></article>)}</div>
 </section>
}