import {getCurrentStaff} from '@/lib/supabase/auth';
import FinanceCenter from '@/components/admin/FinanceCenter';

export default async function FinancePage(){
 const staff=await getCurrentStaff();
 if(!staff)return null;
 if(!['SUPER_ADMIN','FINANCE','ADMIN'].includes(staff.profile.role))return <section className="pb-12"><div className="card p-8"><h1 className="serif text-3xl text-forest">Access restricted</h1><p className="mt-2 text-sm text-forest/55">This workspace is limited to Finance, Admin and Super Admin.</p></div></section>;
 return <section className="pb-12"><div className="mb-6"><div className="eyebrow">Finance & Control</div><h1 className="serif mt-2 text-4xl text-forest">Finance Center</h1><p className="mt-2 text-sm text-forest/55">Revenue, verified payments, service costs, expenses, suppliers, payroll, bonuses and journey profitability.</p></div><FinanceCenter role={staff.profile.role}/></section>;
}
