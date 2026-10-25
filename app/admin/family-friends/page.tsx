import {redirect} from 'next/navigation';
import {getCurrentStaff,hasStaffPermission} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import {FamilyFriendsQuoteManager} from '@/components/admin/FamilyFriendsQuoteManager';
import {FamilyFriendsConversionPanel} from '@/components/admin/FamilyFriendsConversionPanel';
export default async function FamilyFriendsAdminPage(){
 const staff=await getCurrentStaff();
 if(!staff)redirect('/admin/login');
 if(!hasStaffPermission(staff,'familyFriends','view'))redirect('/admin');
 const supabase=getSupabaseAdmin();
 const [{data,error},{data:staffOptions,error:staffError}]=await Promise.all([
  supabase.from('family_friends_quote_requests').select('*').order('created_at',{ascending:false}).limit(200),
  supabase.from('profiles').select('id,full_name,role').in('role',['SALES','CUSTOMER_SERVICE']).order('full_name')
 ]);
 const requests=data||[];
 return <section className="pb-12">
  <div className="eyebrow">SALES WORKSPACE · PRIVATE GROUPS</div>
  <h1 className="serif mt-2 text-4xl text-forest">FAMILY & FRIENDS — طلبات عروض الأسعار</h1>
  <p className="mt-2 max-w-3xl text-sm leading-6 text-forest/60">متابعة الطلبات الخاصة بالعائلات والأصدقاء، مراجعة تفاصيل المجموعة، تسجيل السعر المعروض، وفتح واتساب برسالة جاهزة.</p>
  {(error||staffError)&&<div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">تعذر تحميل بعض بيانات الإدارة. تحقق من قاعدة البيانات والصلاحيات قبل متابعة الطلبات.</div>}
  <div className="mt-7 rounded-2xl border border-[#C9A227]/35 bg-[#f7f3ea] p-5">
   <h2 className="serif text-2xl text-forest">تحويل الطلب المؤكد إلى حجز</h2>
   <p className="mt-2 mb-4 max-w-3xl text-sm text-forest/65">يتطلب الطلب حالة «مؤكد» وسعرًا معتمدًا. التحويل ينشئ حجزًا واحدًا مرتبطًا بالطلب، بحالة طلب جديد وغير مدفوع، ولا يضيفه تلقائيًا إلى مجموعة مشتركة.</p>
   <FamilyFriendsConversionPanel requests={requests}/>
  </div>
  <div className="mt-6"><FamilyFriendsQuoteManager initialRequests={requests} staffOptions={staffOptions||[]}/></div>
 </section>;
}
