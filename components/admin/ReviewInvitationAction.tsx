'use client';

import { useState } from 'react';

type Language = 'en' | 'so' | 'ar';

export function ReviewInvitationAction({ bookingId, language }: { bookingId: string; language: Language }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const labels = {
    en: { create: 'Create review link', loading: 'Creating…', copy: 'Copy message', copied: 'Copied', whatsapp: 'Open WhatsApp', error: 'Could not create the review link.' },
    so: { create: 'Samee xiriirka qiimeynta', loading: 'Waa la sameynayaa…', copy: 'Nuqul fariinta', copied: 'Waa la nuqulay', whatsapp: 'Fur WhatsApp', error: 'Xiriirka qiimeynta lama sameyn karin.' },
    ar: { create: 'إنشاء رابط التقييم', loading: 'جارٍ الإنشاء…', copy: 'نسخ الرسالة', copied: 'تم النسخ', whatsapp: 'فتح واتساب', error: 'تعذر إنشاء رابط التقييم.' },
  }[language];
  async function create() {
    setBusy(true); setError(''); setLink(''); setMessage(''); setCopied(false);
    try {
      const response = await fetch('/api/admin/review-invitations', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId, language }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || labels.error);
      setLink(data.url); setMessage(data.message); setPhone(data.whatsapp || '');
    } catch (e) { setError(e instanceof Error ? e.message : labels.error); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopied(true); }
    catch { setError(language === 'ar' ? 'تعذر النسخ من المتصفح.' : language === 'so' ? 'Nuqulku wuu fashilmay.' : 'Clipboard access was denied.'); }
  }
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  const wa = 'https://wa.me/' + normalizedPhone + '?text=' + encodeURIComponent(message);
  return <div className="flex min-w-[170px] flex-col items-start gap-2">
    <button type="button" onClick={create} disabled={busy} className="rounded-lg border border-[#C9A227]/60 px-3 py-2 text-xs font-semibold text-[#063F35] disabled:opacity-50">{busy ? labels.loading : labels.create}</button>
    {link && <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className="text-xs underline underline-offset-2">{copied ? labels.copied : labels.copy}</button>
      {normalizedPhone.length >= 8 && <a href={wa} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-2">{labels.whatsapp}</a>}
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-2" aria-label={link}>{language === 'ar' ? 'معاينة الرابط' : language === 'so' ? 'Eeg xiriirka' : 'Preview link'}</a>
    </div>}
    {error && <p role="alert" className="max-w-[220px] text-xs text-red-700">{error}</p>}
  </div>;
}
