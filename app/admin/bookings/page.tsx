import { getSupabaseAdmin } from '@/lib/supabase/server';
import { BookingStatusForm } from '@/components/admin/BookingStatusForm';
import { getAdminLocale } from '@/lib/admin-locale';
import { adminText } from '@/lib/admin-text';
import { getCurrentStaff } from '@/lib/supabase/auth';

const statusAr:Record<string,string>={NEW_REQUEST:'طلب جديد',CONTACTED:'تم التواصل',DETAILS_PENDING:'بانتظار التفاصيل',PAYMENT_PENDING:'بانتظار الدفع',PAYMENT_RECEIVED:'تم استلام الدفع',CONFIRMED:'مؤكد',PREPARING:'قيد التجهيز',ACTIVE:'نشطة',COMPLETED:'مكتملة',CANCELLED:'ملغاة'};
const paymentAr:Record<string,string>={NOT_REQUESTED:'لم يُطلب',PENDING:'معلق',PENDING_VERIFICATION:'بانتظار التحقق',RECEIVED:'تم الاستلام',PARTIALLY_RECEIVED:'مستلم جزئيًا',REFUNDED:'مسترد',FAILED:'فشل'};

export default async function BookingsPage(){
 const locale=await getAdminLocale(); const t=adminText[locale];
 const staff=await getCurrentStaff(); if(!staff)return null;
 const canViewFinancial=staff.profile.role==='SUPER_ADMIN'||staff.profile.role==='FINANCE';
 let rows:any[]=[];let error='';
 try{
  const {data,error:e}=await getSupabaseAdmin().from('bookings')
   .select('id,booking_id,guest_count,total_amount,currency,status,payment_status,lead_source,created_at,customers(full_name,whatsapp),packages(name)')
   .order('created_at',{ascending:false}).limit(50);
  if(e)throw e;rows=data||[];
 }catch(e){error=e instanceof Error?e.message:'Unable to load bookings.'}
 const columns=canViewFinancial?10:8;
 const label=(value:string,map:Record<string,string>)=>locale==='ar'?(map[value]||value):value.replaceAll('_',' ');
 return <section className="pb-12">
  <div><div className="eyebrow">{t.common.salesFinance}</div><h1 className="serif mt-2 text-4xl text-forest">{t.page.bookings}</h1><p className="mt-2 text-sm text-forest/55">{t.common.trackBookings}</p></div>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t.common.database}: {error}</div>}
  <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
   <thead className="border-b border-forest/10 bg-[#faf8f2]"><tr>{(locale==='ar'?['رقم الحجز','العميل','الباقة','المصدر','الضيوف',...(canViewFinancial?['الإجمالي']:[]),'حالة الحجز',...(canViewFinancial?['الدفع']:[]),'تاريخ الإنشاء','تحديث']:['Booking ID','Customer','Package','Source','Guests',...(canViewFinancial?['Total']:[]),'Booking status',...(canViewFinancial?['Payment']:[]),'Created','Update']).map(h=><th key={h} className="px-4 py-4 font-semibold text-forest">{h}</th>)}</tr></thead>
   <tbody>{rows.length===0?<tr><td colSpan={columns} className="px-4 py-12 text-center text-forest/45">{t.common.noBookings}</td></tr>:rows.map((row:any)=><tr key={row.id} className="border-b border-forest/8 last:border-0">
    <td className="px-4 py-4 font-semibold text-forest">{row.booking_id}</td>
    <td className="px-4 py-4"><div className="font-semibold">{row.customers?.full_name||'—'}</div><div className="text-xs text-forest/45">{row.customers?.whatsapp||''}</div></td>
    <td className="px-4 py-4">{row.packages?.name||'—'}</td>
    <td className="px-4 py-4"><span className={row.lead_source==='WOMENS_UMRAH'?'rounded-full bg-[#f7f3ea] px-2 py-1 text-xs font-semibold text-forest':'text-xs text-forest/55'}>{row.lead_source==='WOMENS_UMRAH'?(locale==='ar'?'عمرة النساء':'Women’s Umrah'):(locale==='ar'?'الموقع':'Website')}</span></td>
    <td className="px-4 py-4">{row.guest_count}</td>
    {canViewFinancial&&<td className="px-4 py-4">{row.currency||'USD'} {Number(row.total_amount||0).toLocaleString()}</td>}
    <td className="px-4 py-4">{label(row.status,statusAr)}</td>
    {canViewFinancial&&<td className="px-4 py-4">{label(row.payment_status,paymentAr)}</td>}
    <td className="px-4 py-4 text-xs text-forest/45">{new Date(row.created_at).toLocaleDateString(locale==='ar'?'ar-SA':'en-GB')}</td>
    <td className="px-4 py-4">{staff.profile.role==='FINANCE'?<span className="text-xs text-forest/55">{locale==='ar'?'المالية: التحقق من الدفع فقط':'Finance: payment verification only'}</span>:<BookingStatusForm bookingId={row.id} currentStatus={row.status} paymentStatus={row.payment_status}/>}</td>
   </tr>)}</tbody>
  </table></div>
 </section>;
}


