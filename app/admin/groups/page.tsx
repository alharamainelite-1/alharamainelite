import {getSupabaseAdmin} from '@/lib/supabase/server';
import {GroupForm} from '@/components/admin/GroupForm';
import {GroupMemberForm} from '@/components/admin/GroupMemberForm';
import {getAdminLocale} from '@/lib/admin-locale';
import {adminText} from '@/lib/admin-text';
import {getCurrentStaff} from '@/lib/supabase/auth';
import Link from 'next/link';

function compatible(a:any,b:any){
  if(a.package_id!==b.package_id) return false;
  if((a.lead_source||'PUBLIC')!==(b.lead_source||'PUBLIC')) return false;
  if(a.expected_travel_date&&b.expected_travel_date) return a.expected_travel_date===b.expected_travel_date;
  if(a.expected_period_start&&b.expected_period_start){
    const ae=a.expected_period_end||a.expected_period_start;
    const be=b.expected_period_end||b.expected_period_start;
    return a.expected_period_start<=be&&b.expected_period_start<=ae;
  }
  return false;
}

function suggest(bookings:any[]){
  const results:any[]=[];
  const seen=new Set<string>();
  for(const anchor of bookings){
    const candidates=bookings.filter(x=>x.id!==anchor.id&&compatible(anchor,x));
    const walk=(chosen:any[],start:number,total:number)=>{
      if(total>=5&&total<=8){
        const all=[anchor,...chosen];
        const key=all.map(x=>x.id).sort().join('|');
        if(!seen.has(key)){seen.add(key);results.push({anchor,members:chosen,total});}
        if(total===8)return;
      }
      if(total>=8)return;
      for(let i=start;i<candidates.length;i++){
        const next=total+Number(candidates[i].guest_count||0);
        if(next<=8)walk([...chosen,candidates[i]],i+1,next);
      }
    };
    walk([],0,Number(anchor.guest_count||0));
  }
  return results.sort((a,b)=>Number(b.total===8)-Number(a.total===8)||a.members.length-b.members.length);
}

export default async function GroupsPage(){
  const staff=await getCurrentStaff();
  if(!staff)return null;
  const locale=await getAdminLocale();
  const t=adminText[locale];
  const canManage=['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER'].includes(staff.profile.role);
  let groups:any[]=[];let packages:any[]=[];let bookings:any[]=[];let members:any[]=[];let hosts:any[]=[];let hotels:any[]=[];let error='';
  try{
    const s=getSupabaseAdmin();
    const [g,p,b,m,h,ht]=await Promise.all([
      s.from('groups').select('id,group_id,package_id,departure_period_start,departure_period_end,capacity,status,host_id,hotel_makkah_id,hotel_madinah_id,hotel_jeddah_id').order('created_at',{ascending:false}).limit(50),
      s.from('packages').select('id,name').eq('active',true).order('name'),
      s.from('bookings').select('id,booking_id,guest_count,status,package_id,lead_source,expected_travel_date,expected_period_start,expected_period_end,group_matching_status').in('status',['NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE']).order('created_at',{ascending:false}).limit(200),
      s.from('group_members').select('id,group_id,booking_id,guest_count').limit(300),
      s.from('hosts').select('id,name').eq('status','AVAILABLE').order('name').limit(100),
      s.from('hotels').select('id,name,city').eq('availability_status','AVAILABLE').order('name').limit(100)
    ]);
    const dbError=g.error||p.error||b.error||m.error||h.error||ht.error;
    if(dbError)throw dbError;
    groups=g.data||[];packages=p.data||[];members=m.data||[];hosts=h.data||[];hotels=ht.data||[];
    const grouped=new Set(members.map((x:any)=>x.booking_id));
    bookings=(b.data||[]).filter((x:any)=>!grouped.has(x.id));
  }catch(e){error=e instanceof Error?e.message:'Unable to load groups.'}

  const pending=bookings.filter((x:any)=>Number(x.guest_count||0)<5&&x.group_matching_status!=='GROUPED');
  const suggestions=suggest(pending);
  const packageName=(id:string)=>packages.find((p:any)=>p.id===id)?.name||'—';
  const period=(x:any)=>x.expected_travel_date||x.expected_period_start||x.expected_period_end||'—';

  return <section className="pb-12">
    <div className="eyebrow">{locale==='ar'?'إدارة العمليات':'Operations manager'}</div>
    <h1 className="serif mt-2 text-4xl text-forest">{t.page.groups}</h1>
    <p className="mt-2 text-sm text-forest/55">{locale==='ar'?'تخطيط المجموعات الصغيرة المعتمدة وتعيين الموارد التشغيلية.':'Approved small-group planning and operational assignments.'}</p>

    {pending.length>0&&<div className="mt-6 rounded-2xl border border-gold/40 bg-[#fffaf0] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow text-gold">التجميع الذكي</div>
          <h2 className="serif mt-2 text-3xl text-forest">طلبات تحتاج إلى ضم لمجموعة</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-forest/65">أي حجز أقل من 5 ضيوف يظهر هنا. النظام يقترح حجوزات متوافقة لتكوين مجموعة لا تتجاوز 8 ضيوف. لا يتم الضم تلقائيًا.</p>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-forest">{pending.length} طلب</div>
      </div>
      <div className="mt-5 grid gap-4">
        {pending.slice(0,12).map((b:any)=>{
          const s=suggestions.find((x:any)=>x.anchor.id===b.id);
          return <div key={b.id} className="rounded-2xl bg-white p-5 ring-1 ring-forest/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-forest">{b.booking_id}</b>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{b.guest_count} ضيف</span>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{packageName(b.package_id)}</span>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{b.group_matching_status||'NEEDS_MATCHING'}</span>
                </div>
                <div className="mt-2 text-xs text-forest/50">{period(b)} · {b.lead_source==='WOMENS_UMRAH'?'عمرة النساء':'عمرة عامة'}</div>
              </div>
              <Link href={'/admin/journeys/'+b.id} className="btn btn-outline">فتح الرحلة</Link>
            </div>
            <div className="mt-4 rounded-xl bg-[#f7f3ea] p-4">
              {s?<><div className="text-xs font-semibold text-forest/45">اقتراح مطابقة</div><div className="mt-2 flex flex-wrap gap-2">{[s.anchor,...s.members].map((x:any)=><span key={x.id} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-forest">{x.booking_id} · {x.guest_count}</span>)}<span className="px-2 py-2 text-xs font-bold text-gold">= {s.total} ضيوف</span></div></>:<div className="text-sm text-forest/60">لا توجد مطابقة متوافقة حاليًا. سيبقى الطلب في قائمة المتابعة.</div>}
            </div>
          </div>;
        })}
      </div>
    </div>}

    {canManage&&<><GroupForm packages={packages} hosts={hosts} hotels={hotels}/><GroupMemberForm groups={groups.map((r:any)=>({id:r.id,group_id:r.group_id}))} bookings={bookings.filter((x:any)=>['CONFIRMED','PREPARING','ACTIVE'].includes(x.status))}/></>}
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4">{error}</div>}

    <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr>{(locale==='ar'?['المجموعة','الباقة','الفترة','السعة','المضيف','الفنادق','الحالة']:['Group','Package','Period','Capacity','Host','Hotels','Status']).map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>
      {groups.length===0?<tr><td colSpan={7} className="p-12 text-center text-forest/45">{t.common.noGroups}</td></tr>:groups.map((r:any)=><tr key={r.id}><td className="px-4 py-4 font-semibold">{r.group_id||'—'}</td><td className="px-4 py-4">{packageName(r.package_id)}</td><td className="px-4 py-4">{r.departure_period_start||r.departure_period_end?(r.departure_period_start||'—')+' → '+(r.departure_period_end||'—'):'—'}</td><td className="px-4 py-4">{r.capacity||0} <span className="text-forest/40">· {members.filter((m:any)=>m.group_id===r.id).reduce((n:number,m:any)=>n+Number(m.guest_count||0),0)} assigned</span></td><td className="px-4 py-4">{r.host_id?(locale==='ar'?'مُسند':'Assigned'):(locale==='ar'?'غير مُسند':'Unassigned')}</td><td className="px-4 py-4">{[r.hotel_makkah_id,r.hotel_madinah_id,r.hotel_jeddah_id].filter(Boolean).length}/3</td><td className="px-4 py-4">{r.status||'—'}</td></tr>)}
    </tbody></table></div>
  </section>;
}