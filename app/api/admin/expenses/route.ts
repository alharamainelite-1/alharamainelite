import {NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {getCurrentStaff} from "@/lib/supabase/auth";
import {getSupabaseAdmin} from "@/lib/supabase/server";

const MANAGEMENT_ROLES = ["SUPER_ADMIN", "FINANCE"];
const EXPENSE_ROLES = [...MANAGEMENT_ROLES, "OPERATIONS_MANAGER", "JOURNEY_COORDINATOR", "OPERATIONS"];
const CATEGORIES = ["HOTEL", "TRANSPORT", "HOST", "TRAIN", "ACTIVITY", "MARKETING", "OTHER"];
const CURRENCIES = ["USD", "SAR"];

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!EXPENSE_ROLES.includes(staff.profile.role)) {
    return NextResponse.json({ error: "Expense entry access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as any;
  if (!body || body.amount === undefined || !body.category || !body.date) {
    return NextResponse.json({ error: "Amount, category and date are required." }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }
  if (!CATEGORIES.includes(String(body.category))) {
    return NextResponse.json({ error: "Invalid expense category." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date))) {
    return NextResponse.json({ error: "Invalid expense date." }, { status: 400 });
  }
  const currency = String(body.currency || "USD");
  if (!CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: "Invalid currency." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const groupId = body.group_id ? String(body.group_id) : null;
  if (["OPERATIONS", "OPERATIONS_MANAGER", "JOURNEY_COORDINATOR"].includes(staff.profile.role)) {
    if (!groupId) {
      return NextResponse.json({ error: "Select a journey before recording an operational expense." }, { status: 400 });
    }
    const { data: group, error } = await supabase
      .from("groups")
      .select("id,operations_coordinator_id")
      .eq("id", groupId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Could not verify journey assignment." }, { status: 500 });
    if (!group) return NextResponse.json({ error: "Journey not found." }, { status: 404 });
    if (["OPERATIONS", "JOURNEY_COORDINATOR"].includes(staff.profile.role) && group.operations_coordinator_id !== staff.profile.id) {
      return NextResponse.json({ error: "You can only record expenses for journeys assigned to you." }, { status: 403 });
    }
  } else if (groupId) {
    const { data: group, error } = await supabase.from("groups").select("id").eq("id", groupId).maybeSingle();
    if (error) return NextResponse.json({ error: "Could not verify journey." }, { status: 500 });
    if (!group) return NextResponse.json({ error: "Journey not found." }, { status: 404 });
  }

  const insert = {
    booking_id: body.booking_id || null,
    group_id: groupId,
    supplier: body.supplier ? String(body.supplier).slice(0, 200) : null,
    category: String(body.category),
    amount,
    currency,
    date: String(body.date),
    reference: body.reference ? String(body.reference).slice(0, 200) : null,
    notes: body.notes ? String(body.notes).slice(0, 2000) : null,
    created_by: staff.profile.id,
    status: "PENDING",
  };
  const { data, error } = await supabase.from("expenses").insert(insert).select("id,status,group_id,created_by").single();
  if (error) return NextResponse.json({ error: "Could not save expense. Check the details and try again." }, { status: 500 });

  await supabase.from("audit_logs").insert({
    actor_id: staff.profile.id,
    action: "EXPENSE_CREATED",
    entity_type: "expense",
    entity_id: data.id,
    after_data: { ...insert, id: data.id, status: data.status },
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/operations");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/finance");

  // Do not return the amount or any financial aggregates to operational staff.
  return NextResponse.json({ success: true, status: "PENDING" }, { status: 201 });
}
