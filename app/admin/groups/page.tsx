import {getSupabaseAdmin} from '@/lib/supabase/server';
import {GroupForm} from '@/components/admin/GroupForm';
import {GroupMemberForm} from '@/components/admin/GroupMemberForm'; import {getAdminLocale} from '@/lib/admin-locale'; import {adminText} from '@/lib/admin-text';

export default async function GroupsPage(){ const locale=await getAdminLocale(); const t=adminText[locale];
  let rows:any[]=[];let packages:any[]=[];let bookings:any[]=[];let members:any[]=[];let hosts:any[]=[];let hotels:any[]=[];let error='';
  try{
    const s=getSupabaseAdmin();
    const [g,p,b,m,h,ht]=await Promise.all([
      s.from('groups').select('id,group_id,package_id,departure_period_start,departure_period_end,capacity,status,host_id,hotel_makkah_id,hotel_madinah_id,hotel_jeddah_id').order('created_at',{ascending:false}).limit(50),
      s.from('packages').select('id,name').eq('active',true).order('name'),
      s.from('bookings').select('id,booking_id,guest_count,status').in('status',['CONFIRMED','PREPARING','ACTIVE']).order('created_at',{ascending:false}).limit(100),
      s.from('group_members').select('id,group_id,booking_id,guest_count').limit(200),
      s.from('hosts').select('id,name').eq('status','AVAILABLE').order('name').limit(100),
      s.from('hotels').select('id,name,city').eq('availability_status','AVAILABLE').order('name').limit(100)
    ]);
    const dbError=g.error||p.error||b.error||m.error||h.error||ht.error;
    if(dbError) throw dbError;
    rows=g.data||[];packages=p.data||[];members=m.data||[];hosts=h.data||[];hotels=ht.data||[];
    bookings=(b.data||[]).filter((x:any)=>!members.some((mm:any)=>mm.booking_id===x.id));
  }catch(e){error=e instanceof Error?e.message:'Unable to load groups.'}
  return <section className="pb-12">
    <div className="eyebrow">Operations manager</div><h1 className="serif mt-2 text-4xl text-forest">{t.page.groups}</h1><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'تخطيط المجموعات الصغيرة المعتمدة وتعيين الموارد التشغيلية.':'Approved small-group planning and operational assignments.'}</p>
    <GroupForm packages={packages} hosts={hosts} hotels={hotels}/>
    <GroupMemberForm groups={rows.map((r:any)=>({id:r.id,group_id:r.group_id}))} bookings={bookings}/>
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4">{error}</div>}
    <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr>{['Group','Package','Period','Capacity','Host','Hotels','Status'].map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>
      {rows.length===0?<tr><td colSpan={7} className="p-12 text-center text-forest/45">{t.common.noGroups}</td></tr>:rows.map((r:any)=><tr key={r.id}><td className="px-4 py-4 font-semibold">{r.group_id||'—'}</td><td className="px-4 py-4">{r.package_id?'Assigned':'—'}</td><td className="px-4 py-4">{r.departure_period_start||r.departure_period_end?(r.departure_period_start||'—')+' → '+(r.departure_period_end||'—'):'—'}</td><td className="px-4 py-4">{r.capacity||0} <span className="text-forest/40">· {members.filter((m:any)=>m.group_id===r.id).reduce((n:number,m:any)=>n+Number(m.guest_count||0),0)} assigned</span></td><td className="px-4 py-4">{r.host_id?'Assigned':'Unassigned'}</td><td className="px-4 py-4">{[r.hotel_makkah_id,r.hotel_madinah_id,r.hotel_jeddah_id].filter(Boolean).length}/3</td><td className="px-4 py-4">{r.status||'—'}</td></tr>)}
    </tbody></table></div>
  </section>;
}