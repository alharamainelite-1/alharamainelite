"use client";
import { useMemo, useState } from "react";

type Booking = {
  id: string;
  booking_id: string;
  customers?: { full_name?: string | null; whatsapp?: string | null; email?: string | null; country?: string | null; city?: string | null; preferred_language?: string | null } | null;
};

export function GuestForm({ bookings }: { bookings: Booking[] }) {
  const ar = typeof document !== "undefined" && document.cookie.includes("he_locale=ar");
  const [bookingId, setBookingId] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selected = useMemo(() => bookings.find((booking) => booking.id === bookingId), [bookings, bookingId]);

  function chooseBooking(id: string) {
    setBookingId(id);
    const booking = bookings.find((item) => item.id === id);
    setFullName(booking?.customers?.full_name ?? "");
    setWhatsapp(booking?.customers?.whatsapp ?? "");
    setEmail(booking?.customers?.email ?? "");
    setCountry(booking?.customers?.country ?? "");
    setCity(booking?.customers?.city ?? "");
    setPreferredLanguage(booking?.customers?.preferred_language ?? "en");
    setMessage("");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          full_name: fullName,
          whatsapp,
          email,
          country,
          city,
          preferred_language: preferredLanguage,
          notes: form.get("notes"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      setMessage(response.ok ? (ar ? "تمت إضافة العميل." : "Guest added.") : (data.error || (ar ? "تعذر إضافة العميل." : "Could not add guest.")));
      if (response.ok) window.location.reload();
    } catch {
      setMessage(ar ? "حدث خطأ أثناء الاتصال. حاول مجددًا." : "A network error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = "min-w-0 w-full border border-forest/15 bg-white px-3 py-4 text-sm text-forest placeholder:text-forest/40 focus:border-[#c9a227] focus:outline-none";
  return <form onSubmit={submit} className="card mt-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
    <select name="booking_id" required value={bookingId} onChange={(e) => chooseBooking(e.target.value)} className={field}>
      <option value="" disabled>{ar ? "اختر الحجز" : "Select booking"}</option>
      {bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.booking_id}</option>)}
    </select>
    <input name="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={ar ? "اسم العميل الكامل" : "Guest full name"} className={field} />
    <input name="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className={field} />
    <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
    <input name="notes" placeholder={ar ? "ملاحظات" : "Notes"} className={field} />
    <select name="preferred_language" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className={field}>
      <option value="en">English</option><option value="so">Somali</option><option value="ar">Arabic</option>
    </select>
    <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={ar ? "المدينة" : "City"} className={field} />
    <input name="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={ar ? "الدولة" : "Country"} className={field} />
    <div className="flex items-center gap-2"><button className="btn btn-primary" disabled={busy || !selected}>{busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "إضافة عميل" : "Add guest")}</button></div>
    {message && <span role="status" className="text-sm text-forest/60">{message}</span>}
  </form>;
}