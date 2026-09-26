"use client";
import {useMemo,useState} from "react";
type Cost={id:string;category:string;description:string;quantity:number;amount:number;currency:"USD"|"SAR";amount_usd:number|null;cost_stage:string;date:string;notes?:string|null};
const cats=[["HOTEL","الفنادق"],["TRANSPORTATION","النقل"],["TRAIN","قطار الحرمين"],["EXPERIENCE","الفعاليات والتجارب"],["HOST","المضيف"],["OTHER","أخرى"]];
const money=(n:number,c="USD")=>`${c} ${Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}`;
export default function JourneyFinancials({bookingId,revenue,guestCount,costs,canEdit}:{bookingId:string;revenue:number;guestCount:number;costs:Cost[];canEdit:boolean}){
 const [rows,setRows]=useState(costs);const[busy,setBusy]=useState(false);const[msg,setMsg]=useState("");
 const totalUsd=useMemo(()=>rows.reduce((n,x)=>n+Number(x.amount_usd||0),0),[rows]);
 const profit=revenue-totalUsd,margin=revenue>0?(profit/revenue)*100:0;
 const byCat=(cat:string)=>rows.filter(x=>x.category===cat).reduce((n,x)=>n+Number(x.amount_usd||0),0);
 async function add(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg("");const f=new FormData(e.currentTarget);const amount=Number(f.get("amount"));const body={action:"journey_cost",booking_id:bookingId,category:f.get("category"),description:f.get("description"),quantity:1,amount,currency:f.get("currency"),date:f.get("date"),notes:f.get("notes")};const r=await fetch("/api/admin/finance",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(r.ok){setRows(x=>[j.data,...x]);setMsg("تم تسجيل المصروف على هذه الرحلة.");e.currentTarget.reset()}else setMsg(j.error||"تعذر تسجيل المصروف.");setBusy(false)}
 return <section className="card overflow-hidden">
  <div className="border-b border-forest/10 bg-[#f7f3ea] p-6 md:p-7">
   <div className="eyebrow">الملف المالي للرحلة</div>
   <div className="mt-2 flex flex-col gap-6">
    <div><h2 className="serif text-3xl text-forest">مصروفات هذه الرحلة بالتحديد</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-forest/55">سجّل مصروفات هذه الرحلة فقط، مثل الفنادق والنقل والفعاليات والمضيف وأي مصروف آخر. مصروفات الشركة العامة تبقى منفصلة.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
     <div className="rounded-2xl border border-forest/8 bg-white px-5 py-5"><div className="text-xs text-forest/45">إيراد الرحلة</div><div className="mt-2 text-2xl font-bold text-forest md:text-3xl">{money(revenue)}</div></div>
     <div className="rounded-2xl border border-forest/8 bg-white px-5 py-5"><div className="text-xs text-forest/45">إجمالي المصروفات</div><div className="mt-2 text-2xl font-bold text-forest md:text-3xl">{money(totalUsd)}</div></div>
     <div className="rounded-2xl border border-forest/8 bg-white px-5 py-5"><div className="text-xs text-forest/45">المتبقي</div><div className="mt-2 text-2xl font-bold text-forest md:text-3xl">{money(profit)}</div></div>
     <div className="rounded-2xl border border-gold/20 bg-white px-5 py-5"><div className="text-xs text-forest/45">هامش الرحلة</div><div className="mt-2 text-2xl font-bold text-forest md:text-3xl">{margin.toFixed(1)}%</div></div>
    </div>
   </div>
  </div>
  {canEdit&&<form onSubmit={add} className="grid gap-3 border-b border-forest/10 p-6 md:grid-cols-2 lg:grid-cols-4">
   <select name="category" defaultValue="HOTEL" className="h-12">{cats.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
   <input name="description" required placeholder="وصف المصروف — مثال: فندق مكة" className="h-12 lg:col-span-2"/>
   <input name="amount" required type="number" min="0" step="0.01" placeholder="المبلغ" className="h-12"/>
   <select name="currency" defaultValue="SAR" className="h-12"><option value="SAR">ريال سعودي (SAR)</option><option value="USD">دولار أمريكي (USD)</option></select>
   <input name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="h-12"/>
   <input name="notes" placeholder="ملاحظات (اختياري)" className="h-12 lg:col-span-2"/>
   <button className="btn btn-primary h-12" disabled={busy}>{busy?"جارٍ الحفظ…":"إضافة المصروف"}</button>
  </form>}
  {msg&&<div className="px-6 pt-4 text-sm font-medium text-forest/60">{msg}</div>}
  <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
   {cats.map(([cat,label])=><div key={cat} className="rounded-2xl border border-forest/10 bg-white p-5"><div className="text-sm text-forest/50">{label}</div><div className="mt-2 text-2xl font-bold text-forest">{money(byCat(cat))}</div></div>)}
  </div>
  <div className="overflow-x-auto border-t border-forest/10">
   <table className="w-full min-w-[680px] text-sm"><thead><tr>{["التاريخ","المصروف","التصنيف","المبلغ","العملة","ملاحظات"].map(h=><th key={h} className="px-4 py-3 text-right text-xs text-forest/45">{h}</th>)}</tr></thead>
   <tbody>{rows.length?rows.map(x=><tr key={x.id} className="border-t border-forest/8"><td className="px-4 py-3">{x.date}</td><td className="px-4 py-3 font-semibold">{x.description}</td><td className="px-4 py-3">{cats.find(c=>c[0]===x.category)?.[1]||x.category}</td><td className="px-4 py-3 font-semibold">{Number(x.amount).toLocaleString(undefined,{maximumFractionDigits:2})}</td><td className="px-4 py-3 font-semibold">{x.currency}</td><td className="px-4 py-3">{x.notes||"—"}</td></tr>):<tr><td colSpan={6} className="p-10 text-center text-forest/40">لم تسجل مصروفات لهذه الرحلة بعد.</td></tr>}</tbody></table>
  </div>
 </section>
}