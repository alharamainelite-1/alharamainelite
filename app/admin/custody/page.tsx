import {getCurrentStaff} from '@/lib/supabase/auth';
import CustodyCenter from '@/components/admin/CustodyCenter';
import {redirect} from 'next/navigation';

export default async function CustodyPage(){
 const staff=await getCurrentStaff();
 if(!staff)redirect('/admin/login');
 if(!['SUPER_ADMIN','ADMIN','FINANCE'].includes(staff.profile.role))redirect('/admin');
 return <section className="pb-12"><div className="mb-6"><div className="eyebrow">المالية والرقابة</div><h1 className="serif mt-2 text-4xl text-forest">العهد</h1><p className="mt-2 text-sm text-forest/55">إدارة العهد المسلّمة للموظفين والعهد الموجودة لدى الإدارة المالية، مع القيمة والحالة والتسوية وسجل التدقيق.</p></div><CustodyCenter role={staff.profile.role}/></section>;
}