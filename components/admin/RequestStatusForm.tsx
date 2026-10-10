"use client";

import { useState } from 'react';

const LABELS: Record<string, string> = {
  NEW_REQUEST: 'طلب جديد',
  CONTACTED: 'تم التواصل',
  DETAILS_PENDING: 'بانتظار التفاصيل',
  PAYMENT_PENDING: 'بانتظار الدفع',
  PAYMENT_RECEIVED: 'تم استلام الدفع',
  CONFIRMED: 'مؤكد',
  PREPARING: 'قيد التجهيز',
  ACTIVE: 'نشطة',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
};
const EDITABLE_STATUSES = ['CONTACTED', 'DETAILS_PENDING', 'PAYMENT_PENDING', 'CANCELLED'];

export function RequestStatusForm({ id, status }: { id: string; status: string }) {
  const [selected, setSelected] = useState(status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const ar = typeof document !== 'undefined' && document.cookie.includes('he_locale=ar');
  const options = [...new Set([status, ...EDITABLE_STATUSES])];

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status: selected }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        window.location.reload();
        return;
      }
      setMessage(data.error || (ar ? 'تعذر تحديث الطلب.' : 'Could not update request.'));
    } catch {
      setMessage(ar ? 'تعذر الاتصال. حاول مرة أخرى.' : 'Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <div className="flex gap-2">
        <select value={selected} onChange={(event) => setSelected(event.target.value)} className="!py-1 text-xs">
          {options.map((value) => (
            <option key={value} value={value} disabled={!EDITABLE_STATUSES.includes(value)}>
              {ar ? LABELS[value] || value : value.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        <button disabled={busy || selected === status} onClick={save} className="btn btn-outline !px-2 !py-1 text-xs">
          {busy ? '…' : ar ? 'حفظ' : 'Save'}
        </button>
      </div>
      {message && <span role="alert" className="text-[11px] text-red-700">{message}</span>}
    </div>
  );
}
