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
  role: string;
};

export function BookingStatusForm({
  bookingId,
  currentStatus,
  paymentStatus,
  role,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [message, setMessage] = useState('');

  const ar =
    typeof document !== 'undefined' &&
    document.cookie.includes('he_locale=ar');

  const canVerifyPayment =
    role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'FINANCE';

  async function markPaid() {
    if (!canVerifyPayment || paymentStatus === 'RECEIVED') return;

    const confirmed = window.confirm(
      ar
        ? 'هل تؤكد أن كامل المبلغ قد تم استلامه والتحقق منه؟'
        : 'Confirm that the full payment has been received and verified.',
    );

    if (!confirmed) return;

    setPayBusy(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/bookings/payment-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(
          data.error ||
            (ar ? 'تعذر تأكيد الدفع.' : 'Could not verify payment.'),
        );
        return;
      }

      setMessage(
        ar
          ? 'تم تأكيد استلام الدفع، وتم تحديث العمولة إن كان الحجز من شريك.'
          : 'Payment received. Partner commission was updated if this booking has a referral partner.',
      );
      window.location.reload();
    } finally {
      setPayBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMessage('');

    if (status === 'PAYMENT_RECEIVED' && paymentStatus !== 'RECEIVED') {
      try {
        await markPaid();
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });

      const data = await res.json().catch(() => ({}));

      setMessage(
        res.ok
          ? ar
            ? 'تم الحفظ.'
            : 'Saved.'
          : data.error || (ar ? 'تعذر الحفظ.' : 'Could not save.'),
      );

      if (res.ok) window.location.reload();
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
          onChange={(e) => setStatus(e.target.value)}
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

      {canVerifyPayment && paymentStatus !== 'RECEIVED' && (
        <button
          type="button"
          disabled={payBusy || busy}
          onClick={markPaid}
          className="btn btn-primary !px-3 !py-2 text-xs"
        >
          {payBusy
            ? ar
              ? 'جارٍ التحقق…'
              : 'Verifying…'
            : ar
              ? 'تأكيد استلام الدفع'
              : 'Mark payment received'}
        </button>
      )}

      {message && (
        <span className="text-[11px] text-forest/60">{message}</span>
      )}
    </div>
  );
}
