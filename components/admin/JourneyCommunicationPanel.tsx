"use client";

import { useEffect, useMemo, useState } from "react";

type Template = { id: string; key: string; language: string; subject: string | null; body: string; active: boolean };
type Props = {
  bookingId: string; customerId: string; customerName: string; whatsapp: string;
  preferredLanguage: string; packageName: string; guestCount: number;
  totalAmount: number; currency: string; travelPeriod: string;
};

const LABELS: Record<string, Record<string,string>> = {
  en: { title:"WhatsApp follow-up", choose:"Message", send:"Open WhatsApp", copied:"Message copied", logged:"WhatsApp opened and communication logged.", noPhone:"No WhatsApp number on file.", lang:"Language" },
  so: { title:"La socodka WhatsApp", choose:"Fariin", send:"Fur WhatsApp", copied:"Fariinta waa la koobiyey", logged:"WhatsApp waa la furay, xiriirkana waa la diiwaangeliyey.", noPhone:"Lambarka WhatsApp lama hayo.", lang:"Luqad" },
  ar: { title:"المتابعة عبر واتساب", choose:"الرسالة", send:"فتح واتساب", copied:"تم نسخ الرسالة", logged:"تم فتح واتساب وتسجيل عملية التواصل.", noPhone:"لا يوجد رقم واتساب مسجل.", lang:"اللغة" }
};

function fill(body: string, data: Record<string,string>) {
  return body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => data[key] ?? "");
}

export function JourneyCommunicationPanel(props: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [key, setKey] = useState("PAYMENT_RECEIVED");
  const [lang, setLang] = useState(["en","so","ar"].includes(props.preferredLanguage) ? props.preferredLanguage : "en");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const l = LABELS[lang] || LABELS.en;

  useEffect(() => {
    fetch("/api/admin/communications")
      .then(r => r.json()).then(d => setTemplates(Array.isArray(d.templates) ? d.templates : []))
      .catch(() => setTemplates([]));
  }, []);

  const availableKeys = useMemo(() => [...new Set(templates.filter(t=>t.active).map(t=>t.key))], [templates]);
  const template = templates.find(t => t.active && t.key === key && t.language === lang)
    || templates.find(t => t.active && t.key === key && t.language === "en")
    || null;
  const message = template ? fill(template.body, {
    customer_name: props.customerName,
    booking_id: props.bookingId,
    package_name: props.packageName,
    guest_count: String(props.guestCount),
    total_amount: Number(props.totalAmount || 0).toLocaleString(),
    currency: props.currency || "USD",
    travel_period: props.travelPeriod,
  }) : "";

  useEffect(() => {
    if (availableKeys.length && !availableKeys.includes(key)) setKey(availableKeys[0]);
  }, [availableKeys, key]);

  async function openWhatsApp() {
    if (!props.whatsapp) { setNotice(l.noPhone); return; }
    setBusy(true); setNotice("");
    try {
      const r = await fetch("/api/admin/communications", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ bookingId: props.customerId ? props.bookingId : null, customerId: props.customerId, templateId: template?.id ?? null, channel:"WHATSAPP", status:"OPENED" })
      });
      if (!r.ok) throw new Error();
      await navigator.clipboard?.writeText(message).catch(()=>{});
      window.open("https://wa.me/"+props.whatsapp.replace(/[^0-9]/g,"")+"?text="+encodeURIComponent(message), "_blank", "noopener,noreferrer");
      setNotice(l.logged);
    } catch {
      setNotice("Could not log communication.");
    } finally { setBusy(false); }
  }

  if (!templates.length) return <div className="card p-6"><div className="eyebrow">{l.title}</div><p className="mt-3 text-sm text-forest/55">No active templates.</p></div>;

  return <div className="card p-6">
    <div className="eyebrow">{l.title}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <div>
        <label className="text-xs text-forest/45">{l.choose}</label>
        <select value={key} onChange={e=>setKey(e.target.value)} className="mt-1 w-full">{availableKeys.map(k=><option key={k} value={k}>{k.replaceAll("_"," ")}</option>)}</select>
      </div>
      <div>
        <label className="text-xs text-forest/45">{l.lang}</label>
        <select value={lang} onChange={e=>setLang(e.target.value)} className="mt-1 w-full"><option value="en">English</option><option value="so">Somali</option><option value="ar">العربية</option></select>
      </div>
    </div>
    <textarea readOnly value={message} rows={8} className="mt-4 w-full resize-y" />
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy || !message} onClick={openWhatsApp} className="btn btn-primary">{busy ? "..." : l.send}</button>
      {notice && <span className="text-xs text-forest/55">{notice}</span>}
    </div>
  </div>;
}
