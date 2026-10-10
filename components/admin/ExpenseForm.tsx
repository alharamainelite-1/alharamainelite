"use client";

import { useState } from "react";

type ExpenseGroup = { id: string; group_id: string };

export function ExpenseForm({
  groups = [],
  requireGroup = false,
}: {
  groups?: ExpenseGroup[];
  requireGroup?: boolean;
}) {
  const ar = typeof document !== "undefined" && !document.cookie.includes("he_locale=en");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: form.get("amount"),
          category: form.get("category"),
          date: form.get("date"),
          currency: form.get("currency"),
          supplier: form.get("supplier"),
          group_id: form.get("group_id") || null,
          reference: form.get("reference"),
          notes: form.get("notes"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || (ar ? "تعذر إضافة المصروف." : "Could not add expense."));
      setMessage(ar ? "تم تسجيل المصروف وإرساله للمراجعة." : "Expense recorded and sent for review.");
      formElement.reset();
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (ar ? "تعذر إضافة المصروف." : "Could not add expense."));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {groups.length > 0 && (
        <select name="group_id" required={requireGroup} defaultValue="" aria-label={ar ? "الرحلة" : "Journey"}>
          <option value="">{ar ? "اختر الرحلة" : "Select journey"}</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.group_id}</option>)}
        </select>
      )}
      <select name="category" required defaultValue="HOTEL" aria-label={ar ? "تصنيف المصروف" : "Expense category"}>
        <option value="HOTEL">{ar ? "الفندق والإقامة" : "Hotel & accommodation"}</option>
        <option value="TRANSPORT">{ar ? "النقل" : "Transport"}</option>
        <option value="HOST">{ar ? "المضيف" : "Host"}</option>
        <option value="TRAIN">{ar ? "القطار" : "Train"}</option>
        <option value="ACTIVITY">{ar ? "الفعاليات والزيارات" : "Activities & visits"}</option>
        <option value="MARKETING">{ar ? "التسويق" : "Marketing"}</option>
        <option value="OTHER">{ar ? "أخرى" : "Other"}</option>
      </select>
      <input name="amount" required type="number" min="0.01" step="0.01" placeholder={ar ? "المبلغ" : "Amount"} />
      <select name="currency" defaultValue="SAR" aria-label={ar ? "العملة" : "Currency"}>
        <option value="SAR">SAR</option>
        <option value="USD">USD</option>
      </select>
      <input name="date" required type="date" aria-label={ar ? "تاريخ المصروف" : "Expense date"} />
      <input name="supplier" placeholder={ar ? "الفندق أو المورد" : "Hotel or supplier"} />
      <input name="reference" placeholder={ar ? "رقم الفاتورة أو المرجع" : "Invoice/reference"} />
      <input name="notes" placeholder={ar ? "ملاحظات الخدمة" : "Service notes"} className="sm:col-span-2" />
      <div className="sm:col-span-2 flex flex-col gap-2">
        <button className="btn btn-primary" disabled={busy || (requireGroup && groups.length === 0)}>
          {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "تسجيل المصروف" : "Record expense")}
        </button>
        {requireGroup && groups.length === 0 && <p className="text-xs text-forest/55">{ar ? "لا توجد رحلة مسندة إليك حالياً. اطلب من مدير العمليات إسناد الرحلة أولاً." : "No journey is assigned to you yet. Ask the Operations Manager to assign one first."}</p>}
        {message && <span role="status" className="text-sm text-forest/60">{message}</span>}
      </div>
    </form>
  );
}
