import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyApiUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await verifyApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });

  const orderCode = new URL(request.url).searchParams.get("orderCode");
  if (!orderCode || !/^\d+$/.test(orderCode)) {
    return NextResponse.json({ error: "Mã đơn hàng không hợp lệ." }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("subscription_orders")
      .select("status, plan, billing_period, subscription_expires_at")
      .eq("order_code", orderCode)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Không kiểm tra được thanh toán."
    }, { status: 500 });
  }
}
