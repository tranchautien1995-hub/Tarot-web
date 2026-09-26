import { getDailyReadingLimit, type PlanAccess, type PlanId, type SpreadAccess } from "@/lib/plans";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReadingQuotaResult = {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string | null;
};

type ConsumeReadingQuotaInput = {
  access: PlanAccess;
  plan: PlanId;
  preset: SpreadAccess;
  userId: string | null;
  bypass: boolean;
};

function normalizeQuotaRow(value: unknown) {
  if (Array.isArray(value)) return value[0] as Record<string, unknown> | undefined;
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return undefined;
}

export async function consumeDailyReadingQuota({
  access,
  plan,
  preset,
  userId,
  bypass
}: ConsumeReadingQuotaInput): Promise<ReadingQuotaResult | null> {
  const limit = getDailyReadingLimit(access, preset);
  if (bypass || limit === null) return null;

  if (!userId) {
    throw new Error("Không xác định được tài khoản để kiểm tra lượt trải bài.");
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("consume_daily_reading_quota", {
    p_user_id: userId,
    p_plan: plan,
    p_preset: preset,
    p_limit: limit
  });

  if (error) {
    console.error("consume_daily_reading_quota failed", error);
    throw new Error("Chưa thể kiểm tra lượt trải bài. Hãy chạy file SQL giới hạn lượt trong Supabase rồi thử lại.");
  }

  const row = normalizeQuotaRow(data);
  if (!row) {
    throw new Error("Máy chủ không nhận được kết quả kiểm tra lượt trải bài.");
  }

  const used = Number(row.used_count ?? 0);
  const remaining = Number(row.remaining_count ?? Math.max(0, limit - used));

  return {
    allowed: row.allowed === true,
    limit,
    used: Number.isFinite(used) ? used : 0,
    remaining: Number.isFinite(remaining) ? Math.max(0, remaining) : 0,
    resetsAt: typeof row.resets_at === "string" ? row.resets_at : null
  };
}

export function quotaErrorMessage(preset: SpreadAccess, quota: ReadingQuotaResult) {
  const spreadName = preset === "six" ? "6 lá" : preset === "celtic" ? "10 lá" : "này";
  return `Bạn đã dùng hết ${quota.limit} lượt trải bài ${spreadName} trong hôm nay. Lượt sẽ được làm mới lúc 00:00; hãy nâng cấp gói nếu cần đọc thêm.`;
}
