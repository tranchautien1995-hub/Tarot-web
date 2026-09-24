import { NextResponse } from "next/server";
import { extractPaymentCode, getSePayAccount, normalizeAccountNumber, verifySePayWebhook } from "@/lib/sepay";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SePayWebhook = {
  id?: number;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  transferAmount?: number;
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-sepay-signature");
    const timestamp = request.headers.get("x-sepay-timestamp");
    if (!verifySePayWebhook({ rawBody, signature, timestamp })) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    let body: SePayWebhook;
    try {
      body = JSON.parse(rawBody) as SePayWebhook;
    } catch {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    if (body.transferType !== "in") return NextResponse.json({ success: true });
    if (normalizeAccountNumber(body.accountNumber) !== normalizeAccountNumber(getSePayAccount().accountNumber)) {
      return NextResponse.json({ success: true });
    }

    const transactionId = Number(body.id);
    const amount = Number(body.transferAmount);
    const paymentCode = extractPaymentCode(body.code, body.content);
    if (!Number.isSafeInteger(transactionId) || !Number.isInteger(amount) || amount <= 0 || !paymentCode) {
      return NextResponse.json({ success: true });
    }

    const admin = getSupabaseAdminClient();
    const { data: order, error: orderError } = await admin
      .from("subscription_orders")
      .select("order_code, amount, status, payment_reference")
      .eq("payment_code", paymentCode)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order || Number(order.amount) !== amount) return NextResponse.json({ success: true });
    if (order.status === "paid") return NextResponse.json({ success: true });

    const { error: activationError } = await admin.rpc("activate_paid_subscription", {
      p_order_code: Number(order.order_code),
      p_reference: String(transactionId)
    });
    if (activationError) throw activationError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("sepay webhook", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
