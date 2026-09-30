"use client";

import { useEffect, useMemo, useState } from "react";

type Template = { id: string; key: string; language: string; subject: string | null; body: string; active: boolean };
type Props = {
  bookingId: string; bookingReference: string; customerId: string; customerName: string; whatsapp: string;
  preferredLanguage: string; packageName: string; guestCount: number;
  totalAmount: number; currency: string; travelPeriod: string;
  currentStatus: string; paymentStatus: string;
};

const LABELS: Record<string, Record<string,string>> = {
  en: {
    title:"WhatsApp follow-up", choose:"Message type", send:"Open WhatsApp", copy:"Copy message",
    copied:"Message copied", logged:"WhatsApp opened and communication logged.", noPhone:"No WhatsApp number on file.",
    lang:"Language", preview:"Message preview", ready:"Suggested next message", copyFailed:"Could not copy the message."
  },
  so: {
    title:"La socodka WhatsApp", choose:"Nooca fariinta", send:"Fur WhatsApp", copy:"Koobi fariinta",
    copied:"Fariinta waa la koobiyey", logged:"WhatsApp waa la furay, xiriirkana waa la diiwaangeliyey.", noPhone:"Lambarka WhatsApp lama hayo.",
    lang:"Luqadda", preview:"Hordhaca fariinta", ready:"Fariinta xigta ee lagu taliyey", copyFailed:"Fariinta lama koobi karin."
  },
  ar: {
    title:"المتابعة عبر واتساب", choose:"نوع الرسالة", send:"فتح واتساب", copy:"نسخ الرسالة",
    copied:"تم نسخ الرسالة", logged:"تم فتح واتساب وتسجيل عملية التواصل.", noPhone:"لا يوجد رقم واتساب مسجل.",
    lang:"اللغة", preview:"معاينة الرسالة", ready:"الرسالة التالية المقترحة", copyFailed:"تعذر نسخ الرسالة."
  }
};

const TEMPLATE_ORDER = [
  "BOOKING_RECEIVED",
  "REQUEST_RECEIVED",
  "PAYMENT_INSTRUCTIONS",
  "PAYMENT_RECEIVED",
  "BOOKING_CONFIRMED",
  "TRAVEL_DETAILS",
  "HOTEL_DETAILS",
  "AIRPORT_TRANSFER",
  "PRE_TRAVEL_REMINDER",
  "PAYMENT_REMINDER",
  "POST_JOURNEY_REVIEW"
];

const TEMPLATE_LABELS: Record<string, Record<string,string>> = {
  BOOKING_RECEIVED: { en:"New booking — thank you", so:"Booking cusub — mahadsanid", ar:"حجز جديد — شكرًا لاختياركم" },
  REQUEST_RECEIVED: { en:"Journey request received", so:"Codsiga safarka waa la helay", ar:"تم استلام طلب الرحلة" },
  PAYMENT_INSTRUCTIONS: { en:"Payment instructions", so:"Tilmaamaha lacag-bixinta", ar:"تعليمات الدفع" },
  PAYMENT_RECEIVED: { en:"Payment received & verified", so:"Lacag-bixinta waa la xaqiijiyay", ar:"تم استلام الدفع وتأكيده" },
  BOOKING_CONFIRMED: { en:"Booking confirmed", so:"Booking-ga waa la xaqiijiyay", ar:"تم تأكيد الحجز" },
  TRAVEL_DETAILS: { en:"Journey details", so:"Faahfaahinta safarka", ar:"تفاصيل الرحلة" },
  HOTEL_DETAILS: { en:"Hotel details", so:"Faahfaahinta hoteelka", ar:"تفاصيل الفندق" },
  AIRPORT_TRANSFER: { en:"Airport transfer", so:"Gaadiidka garoonka", ar:"تنسيق الاستقبال من المطار" },
  PRE_TRAVEL_REMINDER: { en:"Before your journey", so:"Xusuusin ka hor safarka", ar:"تذكير قبل السفر" },
  PAYMENT_REMINDER: { en:"Payment reminder", so:"Xusuusin lacag-bixin", ar:"تذكير بالدفع" },
  POST_JOURNEY_REVIEW: { en:"Post-journey review", so:"Aragtida kadib safarka", ar:"تقييم الرحلة بعد الإتمام" }
};

function fill(body: string, data: Record<string,string>) {
  return body.replace(/\\n/g, "\n").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => data[key] ?? "");
}

function suggestedKey(status: string, paymentStatus: string) {
  if (status === "PAYMENT_RECEIVED" && paymentStatus === "RECEIVED") return "PAYMENT_RECEIVED";
  if (status === "CONFIRMED" && paymentStatus === "RECEIVED") return "BOOKING_CONFIRMED";
  if (status === "PREPARING") return "TRAVEL_DETAILS";
  if (status === "ACTIVE") return "TRAVEL_DETAILS";
  if (status === "COMPLETED") return "POST_JOURNEY_REVIEW";
  if (status === "PAYMENT_PENDING") return "PAYMENT_INSTRUCTIONS";
  return "BOOKING_RECEIVED";
}

export function JourneyCommunicationPanel(props: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const normalizedPreferredLanguage = (props.preferredLanguage || "en").toLowerCase();
  const [lang, setLang] = useState(["en","so","ar"].includes(normalizedPreferredLanguage) ? normalizedPreferredLanguage : "en");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const l = LABELS[lang] || LABELS.en;
  const rtl = lang === "ar";
  const suggested = suggestedKey(props.currentStatus, props.paymentStatus);
  const [key, setKey] = useState(suggested);

  useEffect(() => {
    setKey(suggested);
  }, [suggested]);

  useEffect(() => {
    fetch("/api/admin/communications")
      .then(r => r.json()).then(d => setTemplates(Array.isArray(d.templates) ? d.templates : []))
      .catch(() => setTemplates([]));
  }, []);

  const availableKeys = useMemo(() => {
    const keys = [...new Set(templates.filter(t=>t.active).map(t=>t.key))];
    return TEMPLATE_ORDER.filter(k => keys.includes(k));
  }, [templates]);

  const template = templates.find(t => t.active && t.key === key && t.language === lang)
    || templates.find(t => t.active && t.key === key && t.language === "en")
    || null;

  const message = template ? fill(template.body, {
    customer_name: props.customerName,
    booking_id: props.bookingReference,
    package_name: props.packageName,
    guest_count: String(props.guestCount),
    total_amount: Number(props.totalAmount || 0).toLocaleString(),
    currency: props.currency || "USD",
    travel_period: props.travelPeriod,
  }) : "";

  async function copyMessage() {
    if (!message) return;
    try { await navigator.clipboard.writeText(message); setNotice(l.copied); }
    catch { setNotice(l.copyFailed); }
  }

  async function openWhatsApp() {
    if (!props.whatsapp) { setNotice(l.noPhone); return; }
    setBusy(true); setNotice("");
    try {
      const r = await fetch("/api/admin/communications", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ bookingId:props.bookingId, customerId:props.customerId, templateId:template?.id??null, channel:"WHATSAPP", status:"OPENED" })
      });
      if (!r.ok) throw new Error();
      await navigator.clipboard?.writeText(message).catch(()=>{});
      window.open("https://wa.me/"+props.whatsapp.replace(/[^0-9]/g,"")+"?text="+encodeURIComponent(message), "_blank", "noopener,noreferrer");
      setNotice(l.logged);
    } catch { setNotice("Could not log communication."); }
    finally { setBusy(false); }
  }

  if (!templates.length) return <div className="card p-6"><div className="eyebrow">{l.title}</div><p className="mt-3 text-sm text-forest/55">No active templates.</p></div>;

  return <div className="card p-6" dir={rtl ? "rtl" : "ltr"}>
    <div className="flex items-start justify-between gap-4">
      <div><div className="eyebrow">{l.title}</div><p className="mt-1 text-xs text-forest/50">{l.ready}</p></div>
      <span className="rounded-full border border-forest/10 bg-forest/[0.03] px-3 py-1 text-[11px] font-medium text-forest/60">{lang==="ar"?"العربية":lang==="so"?"Somali":"English"}</span>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <div>
        <label className="text-xs text-forest/45">{l.choose}</label>
        <select value={key} onChange={e=>{setKey(e.target.value);setNotice("");}} className="mt-1 w-full" dir={rtl?"rtl":"ltr"}>
          {availableKeys.map(k=><option key={k} value={k}>{TEMPLATE_LABELS[k]?.[lang]||TEMPLATE_LABELS[k]?.en||k.replaceAll("_"," ")}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-forest/45">{l.lang}</label>
        <select value={lang} onChange={e=>{setLang(e.target.value);setNotice("");}} className="mt-1 w-full" dir={rtl?"rtl":"ltr"}>
          <option value="en">English</option><option value="so">Somali</option><option value="ar">العربية</option>
        </select>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border border-forest/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-medium text-forest/45">{l.preview}</span>{template?.subject&&<span className="text-xs font-medium text-forest/65">{template.subject}</span>}</div>
      <div className="min-h-[180px] whitespace-pre-wrap rounded-xl bg-forest/[0.025] p-4 text-sm leading-7 text-forest" dir={rtl?"rtl":"ltr"} style={{unicodeBidi:"plaintext"}}>{message}</div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" onClick={copyMessage} disabled={!message||busy} className="btn">{l.copy}</button>
      <button type="button" disabled={busy||!message} onClick={openWhatsApp} className="btn btn-primary">{busy?"...":l.send}</button>
      {notice&&<span className="text-xs text-forest/55">{notice}</span>}
    </div>
  </div>;
}
