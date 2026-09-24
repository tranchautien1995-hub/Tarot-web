import { NextResponse } from "next/server";
import { BILLING_DAYS, BILLING_PRICES, isBillingPeriod, isPaidPlan } from "@/lib/billing";
import { getPlanAccess } from "@/lib/plans";
import { createSePayQrUrl, getSePayAccount } from "@/lib/sepay";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyApiUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

const PLAN_RANK = { free: 0, plus: 1, pro: 2, pro_max: 3 } as const;

export async function POST(request: Request) {
  try {
    const auth = await verifyApiUser(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!auth.user || auth.localMode) {
      return NextResponse.json({ error: "Thanh toán chỉ hoạt động với tài khoản Supabase thật." }, { status: 400 });
    }

    const body = await request.json() as { plan?: unknown; period?: unknown };
    const requestedPlan = body.plan;
    const requestedPeriod = body.period;
    if (!isPaidPlan(requestedPlan) || !isBillingPeriod(requestedPeriod)) {
      return NextResponse.json({ error: "Gói hoặc chu kỳ thanh toán không hợp lệ." }, { status: 400 });
    }

    const current = getPlanAccess(auth.user.app_metadata);
    if (current.isAdmin) {
      return NextResponse.json({ error: "Tài khoản Admin đã có toàn quyền và không cần mua gói." }, { status: 400 });
    }
    if (PLAN_RANK[requestedPlan] < PLAN_RANK[current.plan]) {
      return NextResponse.json({ error: "Không thể hạ gói bằng thanh toán. Hãy chờ gói hiện tại hết hạn hoặc liên hệ quản trị viên." }, { status: 400 });
    }

    const plan = requestedPlan;
    const period = requestedPeriod;
    const amount = BILLING_PRICES[plan][period];
    const durationDays = BILLING_DAYS[period];
    const orderCode = Date.now() * 100 + Math.floor(Math.random() * 100);
    const paymentCode = `TT${orderCode}`;
    const account = getSePayAccount();
    const qrUrl = createSePayQrUrl({ amount, paymentCode });
    const admin = getSupabaseAdminClient();

    const { error: insertError } = await admin.from("subscription_orders").insert({
      order_code: orderCode,
      user_id: auth.user.id,
      plan,
      billing_period: period,
      duration_days: durationDays,
      amount,
      status: "pending",
      payment_code: paymentCode
    });
    if (insertError) throw new Error(`Không tạo được đơn hàng: ${insertError.message}`);

    return NextResponse.json({
      orderCode,
      paymentCode,
      amount,
      qrUrl,
      ...account
    });
  } catch (error) {
    console.error("create payment", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Không thể tạo thanh toán VietQR."
    }, { status: 500 });
  }
}
