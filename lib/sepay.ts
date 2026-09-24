import { createHmac, timingSafeEqual } from "node:crypto";

type SePayEnvName =
  | "SEPAY_BANK_CODE"
  | "SEPAY_ACCOUNT_NUMBER"
  | "SEPAY_WEBHOOK_SECRET";

function requiredEnv(name: SePayEnvName) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu ${name} trên máy chủ.`);
  return value;
}

export function getSePayAccount() {
  return {
    bankCode: requiredEnv("SEPAY_BANK_CODE"),
    accountNumber: requiredEnv("SEPAY_ACCOUNT_NUMBER"),
    accountName: process.env.SEPAY_ACCOUNT_NAME?.trim() || ""
  };
}

export function createSePayQrUrl(input: { amount: number; paymentCode: string }) {
  const account = getSePayAccount();
  const params = new URLSearchParams({
    acc: account.accountNumber,
    bank: account.bankCode,
    amount: String(input.amount),
    des: input.paymentCode
  });
  return `https://vietqr.app/img?${params.toString()}`;
}

export function verifySePayWebhook(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
}) {
  if (!input.signature || !input.timestamp || !/^\d+$/.test(input.timestamp)) return false;
  const timestamp = Number(input.timestamp);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
    return false;
  }

  const digest = createHmac("sha256", requiredEnv("SEPAY_WEBHOOK_SECRET"))
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest("hex");
  const expected = Buffer.from(`sha256=${digest}`, "utf8");
  const received = Buffer.from(input.signature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function normalizeAccountNumber(value: unknown) {
  return String(value ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function extractPaymentCode(payloadCode: unknown, content: unknown) {
  const configured = String(payloadCode ?? "").trim().toUpperCase();
  if (/^TT\d{10,16}$/.test(configured)) return configured;
  return String(content ?? "").toUpperCase().match(/TT\d{10,16}/)?.[0] || "";
}
