import {getSupabaseAdmin} from '@/lib/supabase/server';
import {GroupForm} from '@/components/admin/GroupForm';
import {GroupMemberForm} from '@/components/admin/GroupMemberForm';
import {getAdminLocale} from '@/lib/admin-locale';
import {adminText} from '@/lib/admin-text';
import {getCurrentStaff} from '@/lib/supabase/auth';
import Link from 'next/link';

type BookingRow={
  id:string; booking_id:string; guest_count:number; status:string; package_id:string;
  lead_source:string; expected_travel_date:string|null; expected_period_start:string|null;
  expected_period_end:string|null; expected_period_label:string|null; group_matching_status:string|null;
};

function compatible(a:BookingRow,b:BookingRow){
  if(a.package_id!==b.package_id) return false;
  if((a.lead_source||'PUBLIC')!==(b.lead_source||'PUBLIC')) return false;
  if(a.expected_travel_date && b.expected_travel_date) return a.expected_travel_date===b.expected_travel_date;
  if(a.expected_period_start && b.expected_period_start){
    const aEnd=a.expected_period_end||a.expected_period_start;
    const bEnd=b.expected_period_end||b.expected_period_start;
    return a.expected_period_start<=bEnd && b.expected_period_start<=aEnd;
  }
  if(!a.expected_travel_date && !b.expected_travel_date && a.expected_period_label && b.expected_period_label)
    return a.expected_period_label.trim().toLowerCase()===b.expected_period_label.trim().toLowerCase();
  return false;
}

function buildSuggestions(source:BookingRow[]){
  const out:{anchor:BookingRow; members:BookingRow[]; total:number}[]=[];
  const seen=new Set<string>();
  for(const anchor of source){
    const candidates=source.filter(x=>x.id!==anchor.id&&compatible(anchor,x));
    const walk=(picked:BookingRow[],start:number,total:number)=>{
      if(total>=5 && total<=8){
        const ids=[anchor,...picked].map(x=>x.id).sort().join('|');
        if(!seen.has(ids)){seen.add(ids);out.push({anchor,members:[...picked],total});}
        if(total===8)return;
      }
      if(total>=8)return;
      for(let i=start;i<candidates.length;i++){
        const nextTotal=total+Number(candidates[i].guest_count||0);
        if(nextTotal>8)continue;
        walk([...picked,candidates[i]],i+1,nextTotal);
      }
    };
    walk([],0,Number(anchor.guest_count||0));
  }
  return out.sort((a,b)=>Number(b.total===8)-Number(a.total===8)||a.members.length-b.members.length).slice(0,24);
}

export default async function GroupsPage(){
  const staff=await getCurrentStaff(); if(!staff)return null;
  const canManage=['SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER'].includes(staff.profile.role);
  const locale=await getAdminLocale(); const t=adminText[locale];
  let rows:any[]=[];let packages:any[]=[];let bookings:any[]=[];let matchingBookings:BookingRow[]=[];let suggestions:{anchor:BookingRow;members:BookingRow[];total:number}[]=[];let members:any[]=[];let hosts:any[]=[];let hotels:any[]=[];let error='';
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
    if(dbError) throw dbError;
    rows=g.data||[];packages=p.data||[];members=m.data||[];hosts=h.data||[];hotels=ht.data||[];
    const groupedIds=new Set(members.map((x:any)=>x.booking_id));
    const allUnassigned=(b.data||[]).filter((x:any)=>!groupedIds.has(x.id));
    bookings=allUnassigned.filter((x:any)=>['CONFIRMED','PREPARING','ACTIVE'].includes(x.status));
    matchingBookings=allUnassigned.filter((x:any)=>Number(x.guest_count||0)<5 && x.group_matching_status!=='GROUPED');
    suggestions=buildSuggestions(matchingBookings);
  }catch(e){error=e instanceof Error?e.message:'Unable to load groups.'}

  const packageName=(id:string)=>packages.find((p:any)=>p.id===id)?.name||'—';
  const periodLabel=(x:BookingRow)=>{
    if(x.expected_travel_date)return x.expected_travel_date;
    if(x.expected_period_start)return x.expected_period_start+(x.expected_period_end?' → '+x.expected_period_end:'');
    return x.expected_period_label||'—';
  };

  return <section className="pb-12">
    <div className="eyebrow">{locale==='ar'?'إدارة العمليات':'Operations manager'}</div>
    <h1 className="serif mt-2 text-4xl text-forest">{t.page.groups}</h1>
    <p className="mt-2 text-sm text-forest/55">{locale==='ar'?'تخطيط المجموعات الصغيرة المعتمدة وتعيين الموارد التشغيلية.':'Approved small-group planning and operational assignments.'}</p>

    {matchingBookings.length>0&&<div className="mt-6 rounded-2xl border border-gold/40 bg-[#fffaf0] p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="eyebrow text-gold">التجميع الذكي</div>
          <h2 className="serif mt-2 text-3xl text-forest">طلبات تحتاج إلى ضم لمجموعة</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-forest/65">هذه الحجوزات أقل من 5 ضيوف. يعرض النظام مرشحين متوافقين حتى تصل المجموعة إلى 8 ضيوف. المطابقة اقتراح تشغيلي فقط ولا يتم ضم أي حجز تلقائيًا.</p>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-forest">{matchingBookings.length} طلب يحتاج متابعة</div>
      </div>

      <div className="mt-6 grid gap-4">
        {matchingBookings.slice(0,12).map((b:any)=>{
          const suggestion=suggestions.find(x=>x.anchor.id===b.id);
          return <div key={b.id} className="rounded-2xl bg-white p-5 ring-1 ring-forest/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-forest">{b.booking_id}</span>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{b.guest_count} {b.guest_count===1?'ضيف':'ضيوف'}</span>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{packageName(b.package_id)}</span>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{b.group_matching_status||'NEEDS_MATCHING'}</span>
                </div>
                <div className="mt-2 text-xs text-forest/50">{periodLabel(b)} · {b.lead_source==='WOMENS_UMRAH'?'عمرة النساء':'عمرة عامة'}</div>
              </div>
              <Link href={'/admin/journeys/'+b.id} className="btn btn-outline">فتح الرحلة</Link>
            </div>
            <div className="mt-4 rounded-xl bg-[#f7f3ea] p-4">
              {suggestion?<><div className="text-xs font-semibold text-forest/45">اقتراح مطابقة</div><div className="mt-2 flex flex-wrap items-center gap-2">{[suggestion.anchor,...suggestion.members].map((x:any)=><span key={x.id} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-forest">{x.booking_id} · {x.guest_count}</span>)}<span className="font-bold text-gold">= {suggestion.total} ضيوف</span></div><div className="mt-2 text-xs text-forest/55">مطابقة حسب الباقة ومصدر الطلب وفترة السفر المتوافقة.</div></>:<div className="text-sm text-forest/60">لا يوجد حاليًا مرشح متوافق يكمل المجموعة حتى 8 ضيوف. سيبقى الطلب في قائمة المتابعة.</div>}
            </div>
          </div>
        })}
      </div>
      {matchingBookings.length>12&&<div className="mt-4 text-xs text-forest/50">يظهر أول 12 طلبًا هنا. جميع الطلبات تبقى محفوظة في النظام.</div>}
    </div>}

    {canManage&&<><GroupForm packages={packages} hosts={hosts} hotels={hotels}/><GroupMemberForm groups={rows.map((r:any)=>({id:r.id,group_id:r.group_id}))} bookings={bookings}/></>}
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4">{error}</div>}

    <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr>{(locale==='ar'?['المجموعة','الباقة','الفترة','السعة','المضيف','الفنادق','الحالة']:['Group','Package','Period','Capacity','Host','Hotels','Status']).map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>
      {rows.length===0?<tr><td colSpan={7} className="p-12 text-center text-forest/45">{t.common.noGroups}</td></tr>:rows.map((r:any)=><tr key={r.id}><td className="px-4 py-4 font-semibold">{r.group_id||'—'}</td><td className="px-4 py-4">{r.package_id?packageName(r.package_id):'—'}</td><td className="px-4 py-4">{r.departure_period_start||r.departure_period_end?(r.departure_period_start||'—')+' → '+(r.departure_period_end||'—'):'—'}</td><td className="px-4 py-4">{r.capacity||0} <span className="text-forest/40">· {members.filter((m:any)=>m.group_id===r.id).reduce((n:number,m:any)=>n+Number(m.guest_count||0),0)} assigned</span></td><td className="px-4 py-4">{r.host_id?(locale==='ar'?'مُسند':'Assigned'):(locale==='ar'?'غير مُسند':'Unassigned')}</td><td className="px-4 py-4">{[r.hotel_makkah_id,r.hotel_madinah_id,r.hotel_jeddah_id].filter(Boolean).length}/3</td><td className="px-4 py-4">{r.status||'—'}</td></tr>)}
    </tbody></table></div>
  </section>;
}