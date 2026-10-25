import {getCurrentStaff} from '@/lib/supabase/auth';
import {redirect} from 'next/navigation';
import {getSupabaseAdmin} from '@/lib/supabase/server';
import GuestSupportCasesManager from '@/components/admin/GuestSupportCasesManager';
export default async function GuestSupportWorkspace(){
 const staff=await getCurrentStaff();
 if(!staff)redirect('/admin/login');
 if(!['SUPER_ADMIN','CUSTOMER_SERVICE','SALES','BOOKINGS','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'].includes(staff.profile.role))redirect('/admin');
 const s=getSupabaseAdmin();
 const [bookingsResult,customersResult,staffResult]=await Promise.all([
  s.from('bookings').select('id,booking_id,customers(full_name)').order('created_at',{ascending:false}).limit(200),
  s.from('customers').select('id,full_name').order('full_name').limit(300),s.from('profiles').select('id,full_name,role').in('role',['CUSTOMER_SERVICE','SALES','BOOKINGS','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR']).order('full_name')
 ]);
 const bookings=(bookingsResult.data||[]).map((x:any)=>({id:x.id,booking_id:x.booking_id,customer_name:Array.isArray(x.customers)?x.customers[0]?.full_name||null:x.customers?.full_name||null}));
 const customers=customersResult.data||[];
 return <section className="pb-12"><div className="eyebrow">GUEST EXPERIENCE</div><h1 className="serif mt-2 text-4xl text-forest">تجربة الضيوف والمتابعة</h1><p className="mt-2 max-w-3xl text-sm text-forest/60">تسجيل الاستفسارات والشكاوى وطلبات التعديل، وتحديد الأولوية وموعد المتابعة والتصعيد وربط الحالة برحلة العميل عبر الحجز عند الحاجة.</p><div className="mt-6"><GuestSupportCasesManager bookings={bookings} customers={customers} staffOptions={staffResult.data||[]}/></div></section>
}