'use client';

import { useState } from 'react';

const STATUS = [
  'NEW_REQUEST',
  'CONTACTED',
  'DETAILS_PENDING',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'CONFIRMED',
  'PREPARING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
] as const;

const L: Record<string, string> = {
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

type Props = {
  bookingId: string;
  currentStatus: string;
  paymentStatus: string;
};

type ApiResponse = {
  error?: string;
};

export function BookingStatusForm({
  bookingId,
  currentStatus,
  paymentStatus,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const ar =
    typeof document !== 'undefined' &&
    document.cookie.includes('he_locale=ar');

  async function save() {
    setBusy(true);
    setMessage('');

    try {
      if (status === 'PAYMENT_RECEIVED' && paymentStatus !== 'RECEIVED') {
        const response = await fetch('/api/admin/bookings/payment-status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        });

        const data = (await response.json().catch(() => ({}))) as ApiResponse;

        if (!response.ok) {
          setMessage(
            data.error ||
              (ar ? 'تعذر تأكيد استلام الدفع.' : 'Could not verify payment.'),
          );
          return;
        }

        window.location.reload();
        return;
      }

      const response = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });

      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        setMessage(
          data.error || (ar ? 'تعذر الحفظ.' : 'Could not save.'),
        );
        return;
      }

      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  const canConfirm = paymentStatus === 'RECEIVED';

  return (
    <div className="flex min-w-[300px] flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="!py-2 text-xs"
        >
          {STATUS.map((item) => (
            <option key={item} value={item}>
              {ar ? L[item] : item.replaceAll('_', ' ')}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={busy || (status === 'CONFIRMED' && !canConfirm)}
          onClick={save}
          className="btn btn-outline !px-3 !py-2 text-xs"
        >
          {busy ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : ar ? 'حفظ' : 'Save'}
        </button>
      </div>

      {message && (
        <span className="text-[11px] text-forest/60">{message}</span>
      )}
    </div>
  );
}
