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

const LABELS: Record<(typeof STATUS)[number], string> = {
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

type ApiResponse = {
  error?: string;
};

export function BookingStatusForm({
  bookingId,
  currentStatus,
  paymentStatus,
  role,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const isArabic =
    typeof document !== 'undefined' &&
    document.cookie.includes('he_locale=ar');

  const canVerifyPayment =
    role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'FINANCE';

  const verifyPayment = async () => {
    if (!canVerifyPayment || paymentStatus === 'RECEIVED') return;

    const confirmed = window.confirm(
      isArabic
        ? 'هل تؤكد أن كامل المبلغ قد تم استلامه والتحقق منه؟'
        : 'Confirm that the full payment has been received and verified.',
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/bookings/payment-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        setMessage(
          data.error ||
            (isArabic ? 'تعذر تأكيد الدفع.' : 'Could not verify payment.'),
        );
        return;
      }

      setMessage(
        isArabic
          ? 'تم تأكيد استلام الدفع، وتم تحديث العمولة إن كان الحجز من شريك.'
          : 'Payment received. Partner commission was updated if this booking has a referral partner.',
      );

      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setMessage('');

    try {
      if (status === 'PAYMENT_RECEIVED' && paymentStatus !== 'RECEIVED') {
        await verifyPayment();
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
          data.error || (isArabic ? 'تعذر الحفظ.' : 'Could not save.'),
        );
        return;
      }

      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

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
              {isArabic ? LABELS[item] : item.replaceAll('_', ' ')}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={busy || (status === 'CONFIRMED' && !canConfirm)}
          onClick={save}
          className="btn btn-outline !px-3 !py-2 text-xs"
        >
          {busy ? (isArabic ? 'جارٍ الحفظ…' : 'Saving…') : isArabic ? 'حفظ' : 'Save'}
        </button>
      </div>

      {canVerifyPayment && paymentStatus !== 'RECEIVED' && (
        <button
          type="button"
          disabled={busy}
          onClick={verifyPayment}
          className="btn btn-primary !px-3 !py-2 text-xs"
        >
          {isArabic ? 'تأكيد استلام الدفع' : 'Mark payment received'}
        </button>
      )}

      {message && (
        <span className="text-[11px] text-forest/60">{message}</span>
      )}
    </div>
  );
}
