import {getCurrentStaff} from '@/lib/supabase/auth';
import {redirect} from 'next/navigation';
import TeamManager from '@/components/admin/TeamManager';

export default async function TeamPage(){
 const staff=await getCurrentStaff();
 if(!staff)redirect('/admin/login');
 if(staff.profile.role!=='SUPER_ADMIN')redirect('/admin');
 return <section className="pb-12"><div className="mb-8"><div className="eyebrow">إدارة الفريق</div><h1 className="serif mt-2 text-5xl text-forest">الفريق والصلاحيات</h1><p className="mt-3 max-w-2xl text-forest/55">إنشاء حسابات الموظفين، تحديد الأدوار، وضبط الصلاحيات بطريقة آمنة دون مشاركة كلمات المرور.</p></div><TeamManager/></section>;
}