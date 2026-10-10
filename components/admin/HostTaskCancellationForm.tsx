"use client";

import { useState } from "react";

export function HostTaskCancellationForm({ id, currentStatus, locale = "en" }: { id: string; currentStatus: string; locale?: "ar" | "en" }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ar = locale === "ar";

  async function cancel() {
    setError("");
    if (reason.trim().length < 3) {
      setError(ar ? "اكتب سبب الإلغاء (3 أحرف على الأقل)." : "Enter a cancellation reason (at least 3 characters).");
      return;
    }
    if (currentStatus === "CANCELLED") return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/host-tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status: "CANCELLED", cancellation_reason: reason.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || (ar ? "تعذر إلغاء المهمة." : "Could not cancel task."));
        setBusy(false);
        return;
      }
      window.location.reload();
    } catch {
      setError(ar ? "تعذر الاتصال. حاول مجددًا." : "Network error. Please try again.");
      setBusy(false);
    }
  }

  if (currentStatus === "CANCELLED") {
    return <span className="text-xs text-forest/55">{ar ? "ملغاة" : "Cancelled"}</span>;
  }

  return (
    <div className="flex min-w-44 flex-col gap-2">
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={1000}
        rows={2}
        required
        disabled={busy}
        placeholder={ar ? "سبب الإلغاء مطلوب" : "Cancellation reason required"}
        className="w-full rounded border p-2 text-xs"
      />
      <button type="button" onClick={cancel} disabled={busy} className="btn btn-outline !px-3 !py-2 text-xs">
        {busy ? "…" : ar ? "إلغاء المهمة" : "Cancel task"}
      </button>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
