'use client';
import {useEffect,useMemo,useState} from 'react';

type Any=any;
const labels:any={
 EMPLOYEE:'عهد الموظفين',FINANCE:'عهد المالية',
 CASH:'عهد نقدية',DEVICE:'أجهزة',KEY:'مفاتيح',DOCUMENT:'مستندات',CARD:'بطاقات',ASSET:'أصول',OTHER:'أخرى',
 ACTIVE:'نشطة',RETURNED:'مُعادة',SETTLED:'مُسوّاة',LOST:'مفقودة',CANCELLED:'ملغاة'
};
const money=(n:number,c='SAR')=>`${c} ${Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}`;
export default function CustodyCenter({role}:{role:string}){
 const [d,setD]=useState<Any|null>(null),[tab,setTab]=useState<'EMPLOYEE'|'FINANCE'>('EMPLOYEE'),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const ar=true;
 async function load(){const r=await fetch('/api/admin/custody',{cache:'no-store'});const j=await r.json();if(r.ok)setD(j);else setMsg(j.error||'تعذر تحميل العهد.')}
 useEffect(()=>{load()},[]);
 async function post(body:Any){setBusy(true);setMsg('');const r=await fetch('/api/admin/custody',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();setMsg(r.ok?'تم تسجيل العهدة بنجاح.':j.error||'تعذر الحفظ.');setBusy(false);if(r.ok)load()}
 async function patch(id:string,status:string){const r=await fetch('/api/admin/custody',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status})});const j=await r.json();setMsg(r.ok?'تم تحديث حالة العهدة.':j.error||'تعذر التحديث.');if(r.ok)load()}
 const items=d?.items||[],profiles=d?.profiles||[],shown=useMemo(()=>items.filter((x:Any)=>x.custody_type===tab),[items,tab]);
 const activeValue=shown.filter((x:Any)=>x.status==='ACTIVE').reduce((n:number,x:Any)=>n+Number(x.value||0),0);
 return <div className="grid gap-6">
  {msg&&<div className="rounded-xl border border-gold/30 bg-[#fffaf0] p-4 text-sm text-forest">{msg}</div>}
  <div className="grid gap-3 sm:grid-cols-2"><button onClick={()=>setTab('EMPLOYEE')} className={`card p-5 text-right transition ${tab==='EMPLOYEE'?'ring-2 ring-gold':''}`}><div className="text-xs text-forest/50">إدارة العهد</div><div className="mt-1 text-2xl font-semibold text-forest">عهد الموظفين</div><div className="mt-2 text-sm text-forest/55">العهد المسلّمة لكل موظف مع القيمة والحالة وتاريخ الإرجاع.</div></button><button onClick={()=>setTab('FINANCE')} className={`card p-5 text-right transition ${tab==='FINANCE'?'ring-2 ring-gold':''}`}><div className="text-xs text-forest/50">إدارة العهد</div><div className="mt-1 text-2xl font-semibold text-forest">عهد المالية</div><div className="mt-2 text-sm text-forest/55">العهد النقدية والأصول والمستندات والبطاقات الموجودة لدى المالية.</div></button></div>
  <div className="grid gap-3 sm:grid-cols-3"><div className="card p-5"><div className="text-xs text-forest/50">عدد العهد النشطة</div><div className="mt-2 text-2xl font-semibold text-forest">{shown.filter((x:Any)=>x.status==='ACTIVE').length}</div></div><div className="card p-5"><div className="text-xs text-forest/50">القيمة الحالية</div><div className="mt-2 text-2xl font-semibold text-forest">{money(activeValue)}</div></div><div className="card p-5"><div className="text-xs text-forest/50">إجمالي السجلات</div><div className="mt-2 text-2xl font-semibold text-forest">{shown.length}</div></div></div>
  {['SUPER_ADMIN','FINANCE'].includes(role)&&<section className="card p-5"><div className="eyebrow">سجل العهد</div><h2 className="serif mt-2 text-3xl text-forest">{tab==='EMPLOYEE'?'تسجيل عهدة موظف':'تسجيل عهدة مالية'}</h2><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);post({custody_type:tab,title:f.get('title'),custody_category:f.get('custody_category'),assignee_staff_id:tab==='EMPLOYEE'?f.get('assignee_staff_id'):null,description:f.get('description'),serial_number:f.get('serial_number'),quantity:f.get('quantity'),value:f.get('value'),currency:f.get('currency'),issued_date:f.get('issued_date'),expected_return_date:f.get('expected_return_date'),reference:f.get('reference'),notes:f.get('notes')});e.currentTarget.reset()}} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
   <input name="title" required placeholder="اسم العهدة / وصف مختصر"/>
   <select name="custody_category"><option value="CASH">نقدية</option><option value="DEVICE">جهاز</option><option value="KEY">مفتاح</option><option value="DOCUMENT">مستند</option><option value="CARD">بطاقة</option><option value="ASSET">أصل</option><option value="OTHER">أخرى</option></select>
   {tab==='EMPLOYEE'?<select name="assignee_staff_id" required><option value="">اختر الموظف</option>{profiles.map((p:Any)=><option key={p.id} value={p.id}>{p.full_name||'بدون اسم'} · {p.role}</option>)}</select>:<div className="rounded-lg border border-forest/10 bg-[#f7f3ea] px-4 py-3 text-sm">الجهة: <strong>المالية</strong></div>}
   <input name="serial_number" placeholder="الرقم التسلسلي / المرجع"/>
   <input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" placeholder="الكمية"/>
   <input name="value" required type="number" min="0" step="0.01" placeholder="القيمة"/>
   <select name="currency"><option>SAR</option><option>USD</option></select>
   <input name="issued_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}/>
   <input name="expected_return_date" type="date" placeholder="تاريخ الإرجاع المتوقع"/>
   <input name="reference" placeholder="المرجع"/>
   <input name="description" placeholder="الوصف" className="sm:col-span-2"/>
   <input name="notes" placeholder="ملاحظات" className="sm:col-span-2"/>
   <button disabled={busy} className="btn btn-primary">{busy?'جارٍ الحفظ…':'تسجيل العهدة'}</button>
  </form></section>}
  <section className="card overflow-x-auto p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">سجل العهد</div><h2 className="serif mt-2 text-3xl text-forest">{labels[tab]}</h2></div><div className="text-sm text-forest/55">كل إجراء مالي أو تسوية موثقة في سجل النشاط.</div></div>
   <table className="mt-5 w-full min-w-[1100px] text-sm"><thead><tr>{['العهدة','الموظف / الجهة','النوع','القيمة','تاريخ التسليم','الإرجاع المتوقع','الحالة','الإجراء'].map(h=><th key={h} className="px-3 py-3 text-right">{h}</th>)}</tr></thead><tbody>
   {shown.length===0?<tr><td colSpan={8} className="p-12 text-center text-forest/45">لا توجد عهد مسجلة حتى الآن.</td></tr>:shown.map((x:Any)=><tr key={x.id} className="border-t border-forest/8"><td className="px-3 py-3"><div className="font-semibold">{x.title}</div><div className="text-xs text-forest/45">{x.reference||x.serial_number||'—'}</div></td><td className="px-3 py-3">{x.custody_type==='FINANCE'?'المالية':profiles.find((p:Any)=>p.id===x.assignee_staff_id)?.full_name||'—'}</td><td className="px-3 py-3">{labels[x.custody_category]||x.custody_category}</td><td className="px-3 py-3 font-semibold">{money(x.value,x.currency)}</td><td className="px-3 py-3">{x.issued_date}</td><td className="px-3 py-3">{x.expected_return_date||'—'}</td><td className="px-3 py-3">{labels[x.status]||x.status}</td><td className="px-3 py-3">{x.status==='ACTIVE'&&<span className="flex gap-2">{tab==='EMPLOYEE'&&<button onClick={()=>patch(x.id,'RETURNED')} className="btn btn-outline !px-3 !py-2 text-xs">تم الإرجاع</button>}{tab==='FINANCE'&&<button onClick={()=>patch(x.id,'SETTLED')} className="btn btn-primary !px-3 !py-2 text-xs">تمت التسوية</button>}</span>}{x.status==='RETURNED'&&<span className="text-xs text-forest/55">مُعادة</span>}{x.status==='SETTLED'&&<span className="text-xs text-forest/55">مُسوّاة</span>}</td></tr>)}
   </tbody></table>
  </section>
 </div>
}