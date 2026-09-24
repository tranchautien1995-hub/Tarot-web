export type PlanId = "free" | "plus" | "pro" | "pro_max";
export type SpreadAccess = "three" | "six" | "celtic" | "custom";

export type PlanAccess = {
  allowedPresets: SpreadAccess[];
  canUseReadingStyles: boolean;
  historyLimit: number | null;
  modelTier: "free" | "premium";
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  shortDescription: string;
  weeklyPriceLabel: string;
  monthlyPriceLabel: string;
  modelLabel: string;
  historyLabel: string;
  features: string[];
  unavailable: string[];
  featured?: boolean;
};

export const PLAN_ORDER: PlanId[] = ["free", "plus", "pro", "pro_max"];

export const PLAN_ACCESS: Record<PlanId | "admin", PlanAccess> = {
  free: {
    allowedPresets: ["three"],
    canUseReadingStyles: false,
    historyLimit: 0,
    modelTier: "free"
  },
  plus: {
    allowedPresets: ["three", "six", "celtic"],
    canUseReadingStyles: true,
    historyLimit: 5,
    modelTier: "premium"
  },
  pro: {
    allowedPresets: ["three", "six", "celtic", "custom"],
    canUseReadingStyles: true,
    historyLimit: 10,
    modelTier: "premium"
  },
  pro_max: {
    allowedPresets: ["three", "six", "celtic", "custom"],
    canUseReadingStyles: true,
    historyLimit: 25,
    modelTier: "premium"
  },
  admin: {
    allowedPresets: ["three", "six", "celtic", "custom"],
    canUseReadingStyles: true,
    historyLimit: null,
    modelTier: "premium"
  }
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    shortDescription: "Trải nghiệm Tarot với những tính năng cơ bản.",
    weeklyPriceLabel: "0đ",
    monthlyPriceLabel: "0đ",
    modelLabel: "GPT-5.6 Sol hoặc model tiêu chuẩn",
    historyLabel: "Không lưu lịch sử",
    features: [
      "Trải bài 3 lá",
      "Đọc bài bằng model tiêu chuẩn",
      "Tốc độ xử lý chậm"
    ],
    unavailable: ["Phong cách đọc bài", "Trải bài 6, 10 lá và tùy chọn"]
  },
  plus: {
    id: "plus",
    name: "Plus",
    shortDescription: "Đọc sâu hơn bằng model mạnh và nhiều kiểu trải.",
    weeklyPriceLabel: "29.000đ/tuần",
    monthlyPriceLabel: "59.900đ/tháng",
    modelLabel: "Đọc bài bằng model hiện đại nhất",
    historyLabel: "Lưu 5 trải bài",
    features: [
      "Trải bài 3, 6 và 10 lá",
      "Đọc bài bằng model hiện đại nhất",
      "Đầy đủ phong cách đọc bài",
      "Lưu 5 lịch sử trải bài"
    ],
    unavailable: ["Trải bài tùy chọn", "Lenormand và công cụ chuyên sâu"],
    featured: true
  },
  pro: {
    id: "pro",
    name: "Pro",
    shortDescription: "Bộ công cụ đầy đủ cho nhu cầu đọc bài thường xuyên.",
    weeklyPriceLabel: "39.000đ/tuần",
    monthlyPriceLabel: "119.900đ/tháng",
    modelLabel: "GPT-6 Astra",
    historyLabel: "Lưu 10 trải bài",
    features: [
      "Toàn bộ quyền lợi Plus",
      "Trải bài tùy chọn từ 1 đến 78 lá",
      "Trải bài Lenormand khi phát hành",
      "Các ứng dụng mở rộng",
      "Lưu 10 lịch sử trải bài"
    ],
    unavailable: []
  },
  pro_max: {
    id: "pro_max",
    name: "Pro Max",
    shortDescription: "Mở toàn bộ dịch vụ hiện tại và các công cụ cao cấp.",
    weeklyPriceLabel: "59.000đ/tuần",
    monthlyPriceLabel: "239.990đ/tháng",
    modelLabel: "GPT-6 Astra · ưu tiên cao nhất",
    historyLabel: "Lưu trên 20 trải bài",
    features: [
      "Toàn bộ quyền lợi Pro",
      "Tất cả dịch vụ trên TTarot",
      "Lưu trên 20 lịch sử trải bài",
      "Bản đồ sao khi phát hành",
      "Tử vi và công cụ mới khi phát hành"
    ],
    unavailable: []
  }
};

export function normalizePlan(value: unknown): PlanId {
  return typeof value === "string" && PLAN_ORDER.includes(value as PlanId)
    ? value as PlanId
    : "free";
}

export function hasAdminRole(appMetadata: Record<string, unknown> | null | undefined) {
  if (!appMetadata) return false;
  return appMetadata.role === "admin" || appMetadata.is_admin === true;
}

export function getPlanAccess(
  appMetadata: Record<string, unknown> | null | undefined,
  localMode = false
) {
  const isAdmin = localMode || hasAdminRole(appMetadata);
  const expiryValue = appMetadata?.subscription_expires_at;
  const expiryTime = typeof expiryValue === "string" ? Date.parse(expiryValue) : Number.NaN;
  const subscriptionExpired = Number.isFinite(expiryTime) && expiryTime <= Date.now();
  const plan = isAdmin || !subscriptionExpired
    ? (isAdmin ? "pro_max" : normalizePlan(appMetadata?.subscription_plan))
    : "free";
  return {
    isAdmin,
    plan,
    access: PLAN_ACCESS[isAdmin ? "admin" : plan],
    subscriptionExpired,
    subscriptionExpiresAt: Number.isFinite(expiryTime) ? new Date(expiryTime).toISOString() : null
  };
}

export function isPresetAllowed(access: PlanAccess, preset: SpreadAccess) {
  return access.allowedPresets.includes(preset);
}

export function validatePlanReading(
  access: PlanAccess,
  preset: unknown,
  cardCount: number,
  readingStyle: unknown
) {
  const normalizedPreset = typeof preset === "string" && ["three", "six", "celtic", "custom"].includes(preset)
    ? preset as SpreadAccess
    : null;
  const expectedCounts: Partial<Record<SpreadAccess, number>> = {
    three: 3,
    six: 6,
    celtic: 10
  };

  if (!normalizedPreset || !access.allowedPresets.includes(normalizedPreset)) {
    return "Gói hiện tại không hỗ trợ kiểu trải bài này. Hãy nâng cấp gói để tiếp tục.";
  }
  if (normalizedPreset !== "custom" && expectedCounts[normalizedPreset] !== cardCount) {
    return "Số lá không khớp với kiểu trải bài đã chọn.";
  }
  if (normalizedPreset === "custom" && (cardCount < 1 || cardCount > 78)) {
    return "Trải bài tùy chọn phải có từ 1 đến 78 lá.";
  }
  if (!access.canUseReadingStyles && typeof readingStyle === "string" && readingStyle.trim()) {
    return "Gói Free không hỗ trợ phong cách đọc bài. Hãy nâng cấp gói để sử dụng tính năng này.";
  }
  return null;
}
