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

  if (!fullName || !whatsapp || !country || !packageId || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 100 || !Number.isFinite(totalAmount) || totalAmount < 0) redirect("/admin/bookings/new?error=missing");
  if (expectedDate && (periodStart || periodEnd)) redirect("/admin/bookings/new?error=dates");
  if ((periodStart && !periodEnd) || (!periodStart && periodEnd) || (periodStart && periodEnd && periodEnd < periodStart)) redirect("/admin/bookings/new?error=dates");
  if (!["en", "so", "ar"].includes(language) || !["USD", "SAR", "GBP", "EUR", "CAD", "AUD"].includes(currency)) redirect("/admin/bookings/new?error=invalid");
  if (!["WHATSAPP", "PHONE", "INFLUENCER", "REFERRAL", "OTHER"].includes(source)) redirect("/admin/bookings/new?error=invalid");

  const db = getSupabaseAdmin();
  const { data: selectedPackage, error: packageError } = await db.from("packages").select("id,slug,name").eq("id", packageId).eq("active", true).single();
  if (packageError || !selectedPackage) redirect("/admin/bookings/new?error=package");

  let customerId: string;
  const { data: existingCustomer, error: customerLookupError } = await db.from("customers").select("id").eq("whatsapp", whatsapp).maybeSingle();
  if (customerLookupError) redirect("/admin/bookings/new?error=database");
  if (existingCustomer?.id) {
    customerId = existingCustomer.id;
    const { error } = await db.from("customers").update({ full_name: fullName, country, city: city || null, email: email || null, preferred_language: language }).eq("id", customerId);
    if (error) redirect("/admin/bookings/new?error=database");
  } else {
    const { data: customer, error } = await db.from("customers").insert({ full_name: fullName, whatsapp, country, city: city || null, email: email || null, preferred_language: language }).select("id").single();
    if (error || !customer) redirect("/admin/bookings/new?error=database");
    customerId = customer.id;
  }

  const year = new Date().getFullYear();
  const bookingCode = `HE-${year}-M${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const noteParts = [privateJourney ? "[PRIVATE JOURNEY]" : "[MANUAL BOOKING]", `Source: ${source}`, `Created by staff: ${staff.profile.id}`, notes].filter(Boolean);
  const { data: booking, error: bookingError } = await db.from("bookings").insert({
    booking_id: bookingCode, customer_id: customerId, package_id: selectedPackage.id, guest_count: guestCount,
    total_amount: totalAmount, currency, status: "NEW_REQUEST", payment_status: "NOT_REQUESTED",
    expected_travel_date: expectedDate, expected_period_start: periodStart, expected_period_end: periodEnd,
    notes: noteParts.join("\n"), lead_source: source, group_matching_status: privateJourney ? "PRIVATE_JOURNEY" : "NEEDS_MATCHING"
  }).select("id").single();
  if (bookingError || !booking) redirect("/admin/bookings/new?error=database");

  if (privateJourney) {
    const privateGroupCode = `HE-PRIVATE-${year}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    let privatePeriodEnd = periodEnd;
    if (expectedDate) {
      const endDate = new Date(`${expectedDate}T12:00:00Z`);
      endDate.setUTCDate(endDate.getUTCDate() + 9);
      privatePeriodEnd = endDate.toISOString().slice(0, 10);
    }
    const { data: privateGroup, error: groupError } = await db.from("groups").insert({
      group_id: privateGroupCode,
      package_id: selectedPackage.id,
      departure_period_start: expectedDate || periodStart,
      departure_period_end: privatePeriodEnd,
      capacity: guestCount,
      status: "PLANNING",
      notes: `PRIVATE JOURNEY linked to booking ${bookingCode}. Keep separate from public group matching.\n${notes}`.trim()
    }).select("id").single();
    if (!groupError && privateGroup) {
      const { error: memberError } = await db.from("group_members").insert({
        group_id: privateGroup.id,
        booking_id: booking.id,
        guest_count: guestCount,
        approved_by: staff.profile.id,
        approved_at: new Date().toISOString()
      });
      if (memberError) {
        await db.from("bookings").update({ notes: [...noteParts, `WARNING: private group ${privateGroupCode} created but booking membership needs manual linking.`].join("\\n") }).eq("id", booking.id);
      }
    } else {
      await db.from("bookings").update({ notes: [...noteParts, "WARNING: private group creation failed; create a separate planning group before arranging operations."].join("\\n") }).eq("id", booking.id);
    }
  }

  const { error: travelAdminError } = await db.from("booking_travel_admin").insert({
    booking_id: booking.id, updated_by: staff.profile.id,
    internal_notes: privateJourney ? "Private journey: do not automatically match with other groups." : null
  });
  if (travelAdminError) {
    await db.from("bookings").update({ notes: [...noteParts, "WARNING: booking_travel_admin record could not be created; operations setup needs review."].join("\n") }).eq("id", booking.id);
  }
  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings?created=${encodeURIComponent(bookingCode)}`);
}
