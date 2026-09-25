import { getSupabaseAdmin } from '@/lib/supabase/server';
import { SettingEditor } from '@/components/admin/SettingEditor';
import { TaskSlaEditor } from '@/components/admin/TaskSlaEditor';
import {getAdminLocale} from '@/lib/admin-locale'; import {adminText} from '@/lib/admin-text';

export default async function Page(){
 const locale=await getAdminLocale();const t=adminText[locale];let rows:any[]=[],slas:any[]=[];let error='';
 try{const s=getSupabaseAdmin();const[a,b]=await Promise.all([
  s.from('site_settings').select('key,value,updated_at').in('key',['group_capacity','languages','tagline','whatsapp']).order('key').limit(100),
  s.from('operations_task_slas').select('task_type,target_minutes,warning_minutes,active,updated_at').order('task_type')
 ]);if(a.error||b.error)throw(a.error||b.error);rows=a.data||[];slas=b.data||[]}catch(e){error=e instanceof Error?e.message:'Unable to load records.'}
 return <section className="pb-12">
  <h1 className="serif text-4xl text-forest">{t.page.settings}</h1><p className="mt-2 text-sm text-forest/55">{t.common.settingsDesc}</p>
  {error&&<div className="mt-6 border border-red-200 bg-red-50 p-4">{error}</div>}
  <div className="card mt-6 overflow-x-auto"><div className="p-5"><h2 className="serif text-2xl text-forest">Operations SLA</h2><p className="mt-1 text-sm text-forest/50">Set the target completion window and warning threshold for each operational task type. Changes are recorded in the audit log.</p></div>
   <table className="w-full min-w-[980px] text-left text-sm"><thead><tr>{['Task type','Target (min)','Warning (min)','Active','Updated','Edit'].map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead>
   <tbody>{slas.map(r=><tr key={r.task_type} className="border-t border-forest/8"><td className="px-4 py-4 font-semibold">{String(r.task_type).replaceAll('_',' ')}</td><td className="px-4 py-4">{r.target_minutes}</td><td className="px-4 py-4">{r.warning_minutes}</td><td className="px-4 py-4">{r.active?'Active':'Off'}</td><td className="px-4 py-4 text-xs">{String(r.updated_at||'—')}</td><td className="px-4 py-4"><TaskSlaEditor row={r}/></td></tr>)}</tbody></table>
  </div>
  <div className="card mt-6 overflow-x-auto"><div className="p-5"><h2 className="serif text-2xl text-forest">Site settings</h2></div><table className="w-full min-w-[700px] text-left text-sm"><thead><tr>{['Key','Value','Updated at','Edit'].map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead>
  <tbody>{rows.length===0?<tr><td colSpan={4} className="p-12 text-center text-forest/45">No settings configured yet.</td></tr>:rows.map(r=><tr key={String(r.key)}><td className="px-4 py-4 font-semibold">{String(r.key??'—')}</td><td className="px-4 py-4">{String(r.value??'—')}</td><td className="px-4 py-4">{String(r.updated_at??'—')}</td><td className="px-4 py-4"><SettingEditor setting={{key:String(r.key),value:r.value}}/></td></tr>)}</tbody></table></div>
 </section>
}