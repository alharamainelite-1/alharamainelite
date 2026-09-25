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
  <div className="card mt-6 overflow-x-auto"><div className="p-5"><h2 className="serif text-2xl text-forest">زمن إنجاز المهام التشغيلية (SLA)</h2><p className="mt-1 text-sm text-forest/50">حدد الزمن المستهدف والتنبيه لكل نوع من المهام التشغيلية. كل تعديل يُسجل في سجل النشاط.</p></div>
   <table className="w-full min-w-[980px] text-left text-sm"><thead><tr>{['نوع المهمة','الهدف (دقيقة)','التنبيه (دقيقة)','الحالة','آخر تحديث','تعديل'].map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead>
   <tbody>{slas.map(r=><tr key={r.task_type} className="border-t border-forest/8"><td className="px-4 py-4 font-semibold">{String(r.task_type).replaceAll('_',' ')}</td><td className="px-4 py-4">{r.target_minutes}</td><td className="px-4 py-4">{r.warning_minutes}</td><td className="px-4 py-4">{r.active?'نشط':'متوقف'}</td><td className="px-4 py-4 text-xs">{String(r.updated_at||'—')}</td><td className="px-4 py-4"><TaskSlaEditor row={r}/></td></tr>)}</tbody></table>
  </div>
  <div className="card mt-6 overflow-x-auto"><div className="p-5"><h2 className="serif text-2xl text-forest">إعدادات الموقع</h2></div><table className="w-full min-w-[700px] text-left text-sm"><thead><tr>{['المفتاح','القيمة','آخر تحديث','تعديل'].map(h=><th key={h} className="px-4 py-4">{h}</th>)}</tr></thead>
  <tbody>{rows.length===0?<tr><td colSpan={4} className="p-12 text-center text-forest/45">لا توجد إعدادات مهيأة حتى الآن.</td></tr>:rows.map(r=><tr key={String(r.key)}><td className="px-4 py-4 font-semibold">{String(r.key??'—')}</td><td className="px-4 py-4">{String(r.value??'—')}</td><td className="px-4 py-4">{String(r.updated_at??'—')}</td><td className="px-4 py-4"><SettingEditor setting={{key:String(r.key),value:r.value}}/></td></tr>)}</tbody></table></div>
 </section>
}