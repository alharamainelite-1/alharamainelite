"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentStaff, hasStaffPermission } from "@/lib/supabase/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function createManualBooking(formData: FormData) {
  const staff = await getCurrentStaff();
  if (!staff || !hasStaffPermission(staff, "bookings", "create")) redirect("/admin/login");

  const fullName = value(formData, "full_name");
  const whatsapp = value(formData, "whatsapp");
  const country = value(formData, "country");
  const city = value(formData, "city");
  const email = value(formData, "email");
  const language = value(formData, "preferred_language") || "en";
  const packageId = value(formData, "package_id");
  const guestCount = Number(value(formData, "guest_count"));
  const totalAmount = Number(value(formData, "total_amount"));
  const currency = value(formData, "currency") || "USD";
  const expectedDate = value(formData, "expected_travel_date") || null;
  const periodStart = value(formData, "expected_period_start") || null;
  const periodEnd = value(formData, "expected_period_end") || null;
  const notes = value(formData, "notes");
  const source = value(formData, "lead_source") || "WHATSAPP";
  const privateJourney = value(formData, "private_journey") === "on";

  if (!fullName || !whatsapp || !country || !packageId || !Number.isInteger(guestCount) || guestCount < 1 || !Number.isFinite(totalAmount) || totalAmount < 0) {
    redirect("/admin/bookings/new?error=missing");
  }
  if (expectedDate && (periodStart || periodEnd)) redirect("/admin/bookings/new?error=dates");
  if ((periodStart && !periodEnd) || (!periodStart && periodEnd) || (periodStart && periodEnd && periodEnd < periodStart)) {
    redirect("/admin/bookings/new?error=dates");
  }
  if (!["en", "so", "ar"].includes(language) || !["USD", "SAR", "GBP", "EUR", "CAD", "AUD"].includes(currency)) {
    redirect("/admin/bookings/new?error=invalid");
  }

  const db = getSupabaseAdmin();
  const { data: selectedPackage, error: packageError } = await db.from("packages")
    .select("id,slug,name").eq("id", packageId).eq("active", true).single();
  if (packageError || !selectedPackage) redirect("/admin/bookings/new?error=package");

  let customerId: string;
  const { data: existingCustomer, error: customerLookupError } = await db.from("customers")
    .select("id").eq("whatsapp", whatsapp).maybeSingle();
  if (customerLookupError) redirect("/admin/bookings/new?error=database");

  if (existingCustomer?.id) {
    customerId = existingCustomer.id;
    const { error } = await db.from("customers").update({
      full_name: fullName, country, city: city || null, email: email || null, preferred_language: language
    }).eq("id", customerId);
    if (error) redirect("/admin/bookings/new?error=database");
  } else {
    const { data: customer, error } = await db.from("customers").insert({
      full_name: fullName, whatsapp, country, city: city || null, email: email || null, preferred_language: language
    }).select("id").single();
    if (error || !customer) redirect("/admin/bookings/new?error=database");
    customerId = customer.id;
  }

  const year = new Date().getFullYear();
  const bookingCode = `HE-${year}-M${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const noteParts = [
    privateJourney ? "[PRIVATE JOURNEY]" : "[MANUAL BOOKING]",
    `Source: ${source}`,
    `Created by staff: ${staff.profile.id}`,
    notes
  ].filter(Boolean);

  const { data: booking, error: bookingError } = await db.from("bookings").insert({
    booking_id: bookingCode,
    customer_id: customerId,
    package_id: selectedPackage.id,
    guest_count: guestCount,
    total_amount: totalAmount,
    currency,
    status: "NEW_REQUEST",
    payment_status: "NOT_REQUESTED",
    expected_travel_date: expectedDate,
    expected_period_start: periodStart,
    expected_period_end: periodEnd,
    notes: noteParts.join("\n"),
    lead_source: source,
    group_matching_status: privateJourney ? "PRIVATE_JOURNEY" : "NEEDS_MATCHING"
  }).select("id").single();

  if (bookingError || !booking) redirect("/admin/bookings/new?error=database");

  const { error: travelAdminError } = await db.from("booking_travel_admin").insert({
    booking_id: booking.id,
    updated_by: staff.profile.id,
    internal_notes: privateJourney ? "Private journey: do not automatically match with other groups." : null
  });
  if (travelAdminError) {
    // Keep the booking; report the secondary setup issue in its notes for follow-up.
    await db.from("bookings").update({
      notes: [...noteParts, "WARNING: booking_travel_admin record could not be created; operations setup needs review."].join("\n")
    }).eq("id", booking.id);
  }

  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings?created=${encodeURIComponent(bookingCode)}`);
}

export default async function NewManualBookingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !hasStaffPermission(staff, "bookings", "create")) redirect("/admin/login");

  const params = await searchParams;
  const db = getSupabaseAdmin();
  const { data: packages, error } = await db.from("packages").select("id,name,slug,price,currency").eq("active", true).order("price");
  const errorText: Record<string, string> = {
    missing: "أكمل الحقول المطلوبة وتأكد من عدد المسافرين والسعر.",
    dates: "راجع تاريخ السفر المتوقع أو الفترة؛ لا تجمع بين التاريخ المحدد والفترة.",
    invalid: "تحقق من اللغة أو العملة المختارة.",
    package: "تعذر العثور على الباقة المختارة. حدّث الصفحة وحاول مجددًا.",
    database: "لم يتم إكمال الحفظ بسبب خطأ في قاعدة البيانات. تحقق من الحجوزات قبل إعادة المحاولة."
  };

  return (
    <section className="pb-12" dir="rtl">
      <div className="eyebrow">الحجوزات والمبيعات</div>
      <h1 className="serif mt-2 text-4xl text-forest">إنشاء حجز يدوي</h1>
      <p className="mt-2 max-w-3xl text-sm text-forest/60">
        سجّل الحجز الذي وصل عبر واتساب أو الهاتف أو أحد الشركاء. سيُحفظ في نظام الحجوزات نفسه ليتمكن الفريق من متابعة التأكيد والتجهيز والتشغيل.
      </p>
      {params.error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorText[params.error] || "تعذر إكمال الطلب."}</div>}
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">تعذر تحميل الباقات. حاول مجددًا.</div>}
      <form action={createManualBooking} className="card mt-6 space-y-6 p-5 md:p-7">
        <div>
          <h2 className="text-lg font-semibold text-forest">بيانات العميل</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">الاسم الكامل *<input required name="full_name" autoComplete="name" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">رقم واتساب مع رمز الدولة *<input required name="whatsapp" autoComplete="tel" placeholder="+44..." className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">بلد الإقامة *<input required name="country" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">المدينة<input name="city" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">البريد الإلكتروني<input type="email" name="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">لغة التواصل<select name="preferred_language" defaultValue="en" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3"><option value="en">English</option><option value="so">Soomaali</option><option value="ar">العربية</option></select></label>
          </div>
        </div>
        <div className="border-t border-forest/10 pt-5">
          <h2 className="text-lg font-semibold text-forest">تفاصيل الرحلة والحجز</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">مصدر الحجز *<select name="lead_source" defaultValue="WHATSAPP" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3"><option value="WHATSAPP">واتساب</option><option value="PHONE">اتصال هاتفي</option><option value="INFLUENCER">مؤثر / شريك</option><option value="REFERRAL">توصية عميل</option><option value="OTHER">أخرى</option></select></label>
            <label className="block text-sm">الباقة المرجعية *<select required name="package_id" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" defaultValue=""><option value="" disabled>اختر الباقة</option>{(packages || []).map((pkg: {id:string;name:string;slug:string;price:number;currency:string}) => <option key={pkg.id} value={pkg.id}>{pkg.name} — {pkg.currency} {Number(pkg.price).toLocaleString()}</option>)}</select><span className="mt-1 block text-xs text-forest/50">يمكن إدخال السعر المتفق عليه يدويًا في الحقل المالي أدناه.</span></label>
            <label className="block text-sm">عدد المسافرين *<input required type="number" min="1" max="100" step="1" name="guest_count" defaultValue="1" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">إجمالي السعر المتفق عليه *<input required type="number" min="0" step="0.01" name="total_amount" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" placeholder="مثال: 7500" /></label>
            <label className="block text-sm">العملة<select name="currency" defaultValue="USD" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3"><option value="USD">USD — دولار أمريكي</option><option value="SAR">SAR — ريال سعودي</option><option value="GBP">GBP — جنيه إسترليني</option><option value="EUR">EUR — يورو</option><option value="CAD">CAD — دولار كندي</option><option value="AUD">AUD — دولار أسترالي</option></select></label>
            <label className="block text-sm">تاريخ السفر المتوقع<input type="date" name="expected_travel_date" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /><span className="mt-1 block text-xs text-forest/50">أو اتركه فارغًا وحدد فترة متوقعة في الحقلين التاليين.</span></label>
            <label className="block text-sm">بداية الفترة المتوقعة<input type="date" name="expected_period_start" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">نهاية الفترة المتوقعة<input type="date" name="expected_period_end" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-forest/10 p-4 text-sm"><input type="checkbox" name="private_journey" defaultChecked className="mt-1" /><span><strong className="block">رحلة خاصة</strong><span className="text-forest/60">لا تدمج هذا الحجز تلقائيًا مع مجموعة أخرى.</span></span></label>
          <label className="mt-4 block text-sm">ملاحظات واتفاق العميل<textarea name="notes" rows={4} placeholder="الخدمات المتفق عليها، عدد الغرف، طلبات خاصة، مرجع المحادثة..." className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-forest/10 pt-5">
          <button type="submit" className="btn btn-primary">إنشاء الحجز</button>
          <a href="/admin/bookings" className="btn btn-outline">إلغاء</a>
        </div>
        <p className="text-xs text-forest/50">سيُنشأ الحجز بحالة «طلب جديد» دون اعتباره مؤكدًا أو مدفوعًا تلقائيًا.</p>
      </form>
    </section>
  );
}
