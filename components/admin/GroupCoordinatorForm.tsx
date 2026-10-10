"use client";

import { useState } from "react";

type Coordinator = { id: string; full_name: string | null };

export function GroupCoordinatorForm({
  groupId,
  currentCoordinatorId,
  coordinators,
}: {
  groupId: string;
  currentCoordinatorId: string | null;
  coordinators: Coordinator[];
}) {
  const [value, setValue] = useState(currentCoordinatorId || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const ar = typeof document !== "undefined" && !document.cookie.includes("he_locale=en");

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/groups", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: groupId, operations_coordinator_id: value || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not assign coordinator.");
      setMessage(ar ? "تم حفظ الإسناد" : "Assignment saved");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-40 flex-col gap-2">
      <select aria-label={ar ? "منسق الرحلة" : "Journey coordinator"} value={value} onChange={(e) => setValue(e.target.value)} className="!py-2 text-xs">
        <option value="">{ar ? "غير مسند" : "Unassigned"}</option>
        {coordinators.map((coordinator) => (
          <option key={coordinator.id} value={coordinator.id}>{coordinator.full_name || (ar ? "منسق عمليات" : "Operations coordinator")}</option>
        ))}
      </select>
      <button type="button" disabled={busy || value === (currentCoordinatorId || "")} onClick={save} className="btn btn-outline !px-2 !py-1 text-xs">
        {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ المنسق" : "Save coordinator")}
      </button>
      {message && <span role="status" className="text-xs text-forest/60">{message}</span>}
    </div>
  );
}
