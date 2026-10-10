import {getCurrentStaff} from '@/lib/supabase/auth';
import StaffTasksManager from '@/components/admin/StaffTasksManager';
export default async function StaffTasksPage(){
 const staff=await getCurrentStaff();
 if(!staff)return null;
 return <section className="pb-12"><StaffTasksManager/></section>;
}
