import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentStaff, hasStaffPermission } from "@/lib/supabase/auth";
import { createManualBooking } from "./actions";

export default async function NewManualBookingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff || !hasStaffPermission(staff, "bookings", "create")) redirect("/admin/login");
  const params = await searchParams;
  const db = getSupabaseAdmin();
  const { data: packages, error } = await db.from("packages").select("id,name,slug,price,currency").eq("active", true).order("price");
  const errorText: Record<string, string> = {
    missing: "أكمل الحقول المطلوبة وتأكد من عدد المسافرين والسعر.",
    dates: "راجع تاريخ السفر المتوقع أو الفترة؛ لا تجمع بين التاريخ المحدد والفترة.",
    invalid: "تحقق من اللغة أو العملة أو مصدر الحجز المختار.",
    package: "تعذر العثور على الباقة المختارة. حدّث الصفحة وحاول مجددًا.",
    database: "لم يتم إكمال الحفظ بسبب خطأ في قاعدة البيانات. تحقق من الحجوزات قبل إعادة المحاولة."
  };
  return (
    <section className="pb-12" dir="rtl">
      <div className="eyebrow">الحجوزات والمبيعات</div>
      <h1 className="serif mt-2 text-4xl text-forest">إنشاء حجز يدوي</h1>
      <p className="mt-2 max-w-3xl text-sm text-forest/60">سجّل الحجز الذي وصل عبر واتساب أو الهاتف أو أحد الشركاء. سيُحفظ في نظام الحجوزات نفسه ليتمكن الفريق من متابعة التأكيد والتجهيز والتشغيل.</p>
      {params.error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorText[params.error] || "تعذر إكمال الطلب."}</div>}
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">تعذر تحميل الباقات. حاول مجددًا.</div>}
      <form action={createManualBooking} className="card mt-6 space-y-6 p-5 md:p-7">
        <div><h2 className="text-lg font-semibold text-forest">بيانات العميل</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">الاسم الكامل *<input required name="full_name" autoComplete="name" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">رقم واتساب مع رمز الدولة *<input required name="whatsapp" autoComplete="tel" placeholder="+44..." className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">بلد الإقامة *<input required name="country" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">المدينة<input name="city" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">البريد الإلكتروني<input type="email" name="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">لغة التواصل<select name="preferred_language" defaultValue="en" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3"><option value="en">English</option><option value="so">Soomaali</option><option value="ar">العربية</option></select></label>
          </div>
        </div>
        <div className="border-t border-forest/10 pt-5"><h2 className="text-lg font-semibold text-forest">تفاصيل الرحلة والحجز</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">مصدر الحجز *<select name="lead_source" defaultValue="WHATSAPP" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3"><option value="WHATSAPP">واتساب</option><option value="PHONE">اتصال هاتفي</option><option value="INFLUENCER">مؤثر / شريك</option><option value="REFERRAL">توصية عميل</option><option value="OTHER">أخرى</option></select></label>
            <label className="block text-sm">الباقة المرجعية *<select required name="package_id" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" defaultValue=""><option value="" disabled>اختر الباقة</option>{(packages || []).map((pkg: {id:string;name:string;slug:string;price:number;currency:string}) => <option key={pkg.id} value={pkg.id}>{pkg.name} — {pkg.currency} {Number(pkg.price).toLocaleString()}</option>)}</select><span className="mt-1 block text-xs text-forest/50">يمكن إدخال السعر المتفق عليه يدويًا.</span></label>
            <label className="block text-sm">عدد المسافرين *<input required type="number" min="1" max="100" step="1" name="guest_count" defaultValue="1" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">إجمالي السعر المتفق عليه *<input required type="number" min="0" step="0.01" name="total_amount" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" placeholder="مثال: 7500" /></label>
            <label className="block text-sm">العملة<select name="currency" defaultValue="USD" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3"><option value="USD">USD — دولار أمريكي</option><option value="SAR">SAR — ريال سعودي</option><option value="GBP">GBP — جنيه إسترليني</option><option value="EUR">EUR — يورو</option><option value="CAD">CAD — دولار كندي</option><option value="AUD">AUD — دولار أسترالي</option></select></label>
            <label className="block text-sm">تاريخ السفر المتوقع<input type="date" name="expected_travel_date" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /><span className="mt-1 block text-xs text-forest/50">أو اتركه فارغًا وحدد فترة متوقعة.</span></label>
            <label className="block text-sm">بداية الفترة المتوقعة<input type="date" name="expected_period_start" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
            <label className="block text-sm">نهاية الفترة المتوقعة<input type="date" name="expected_period_end" className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-forest/10 p-4 text-sm"><input type="checkbox" name="private_journey" defaultChecked className="mt-1" /><span><strong className="block">رحلة خاصة</strong><span className="text-forest/60">لا تدمج هذا الحجز تلقائيًا مع مجموعة أخرى.</span></span></label>
          <label className="mt-4 block text-sm">ملاحظات واتفاق العميل<textarea name="notes" rows={4} placeholder="الخدمات المتفق عليها، عدد الغرف، طلبات خاصة، مرجع المحادثة..." className="mt-1 w-full rounded-lg border border-forest/15 bg-white p-3" /></label>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-forest/10 pt-5"><button type="submit" className="btn btn-primary">إنشاء الحجز</button><a href="/admin/bookings" className="btn btn-outline">إلغاء</a></div>
        <p className="text-xs text-forest/50">سيُنشأ الحجز بحالة «طلب جديد» دون اعتباره مؤكدًا أو مدفوعًا تلقائيًا.</p>
      </form>
    </section>
  );
}
