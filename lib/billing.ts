import type { PlanId } from "@/lib/plans";

export type PaidPlanId = Exclude<PlanId, "free">;
export type BillingPeriod = "week" | "month";

export const BILLING_PRICES: Record<PaidPlanId, Record<BillingPeriod, number>> = {
  plus: { week: 29_000, month: 59_900 },
  pro: { week: 39_000, month: 119_900 },
  pro_max: { week: 59_000, month: 239_990 }
};

export const BILLING_DAYS: Record<BillingPeriod, number> = {
  week: 7,
  month: 30
};

export function isPaidPlan(value: unknown): value is PaidPlanId {
  return value === "plus" || value === "pro" || value === "pro_max";
}

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return value === "week" || value === "month";
}
