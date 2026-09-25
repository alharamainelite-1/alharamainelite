import { getSupabaseAdmin } from '@/lib/supabase/server';
import { RequestStatusForm } from '@/components/admin/RequestStatusForm';
import {getAdminLocale} from '@/lib/admin-locale'; import {adminText} from '@/lib/admin-text';

export default async function RequestsPage() { const locale=await getAdminLocale(); const t=adminText[locale];
  let rows:any[]=[]; let error='';
  try {
    const {data,error:queryError}=await getSupabaseAdmin().from('journey_requests').select('id,reference,guest_count,estimated_total,currency,status,lead_source,created_at,expected_period_label,customers(full_name,whatsapp,country),packages(name,slug)').order('created_at',{ascending:false}).limit(50);
    if(queryError) throw queryError; rows=data||[];
  } catch(e){error=e instanceof Error?e.message:'Unable to load requests.';}
  return <section className="pb-12"><div><div className="eyebrow">{t.common.salesWorkspace}</div><h1 className="serif mt-2 text-4xl text-forest">{t.page.requests}</h1><p className="mt-2 text-sm text-forest/55">{t.common.reviewIncoming}</p></div>
    {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t.common.database}: {error}</div>}
    <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-forest/10 bg-[#faf8f2]"><tr>{['Reference','Customer','Package','Source','Guests','Period','Estimate','Status','Received'].map(h=><th key={h} className="px-4 py-4 font-semibold text-forest">{h}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={9} className="px-4 py-12 text-center text-forest/45">{t.common.noRequests}</td></tr>:rows.map((row:any)=><tr key={row.id} className="border-b border-forest/8 last:border-0"><td className="px-4 py-4 font-semibold text-forest">{row.reference}</td><td className="px-4 py-4"><div className="font-semibold">{row.customers?.full_name||'—'}</div><div className="text-xs text-forest/45">{row.customers?.whatsapp||''}</div></td><td className="px-4 py-4">{row.packages?.name||'—'}</td><td className="px-4 py-4"><span className={row.lead_source==='WOMENS_UMRAH'?'rounded-full bg-[#f7f3ea] px-2 py-1 text-xs font-semibold text-forest':'text-xs text-forest/55'}>{row.lead_source==='WOMENS_UMRAH'?'Women’s Umrah':'Website'}</span></td><td className="px-4 py-4">{row.guest_count}</td><td className="px-4 py-4">{row.expected_period_label||'Specific date'}</td><td className="px-4 py-4">{'$'}{Number(row.estimated_total).toLocaleString()}</td><td className="px-4 py-4"><RequestStatusForm id={row.id} status={row.status}/></td><td className="px-4 py-4 text-xs text-forest/45">{new Date(row.created_at).toLocaleDateString('en-GB')}</td></tr>)}</tbody></table></div>
  </section>;
}
