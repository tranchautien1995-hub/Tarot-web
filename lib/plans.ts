export type PlanId = "free" | "plus" | "pro" | "pro_max";
export type SpreadAccess = "three" | "six" | "celtic" | "future_love" | "zodiac_houses" | "health_overview" | "tree_of_life" | "matrix_3x3";

const SPECIALIZED_PRESETS: SpreadAccess[] = [
  "future_love",
  "zodiac_houses",
  "health_overview",
  "tree_of_life",
  "matrix_3x3"
];

export type PlanAccess = {
  allowedPresets: SpreadAccess[];
  canUseReadingStyles: boolean;
  canUseLenormand: boolean;
  canUseAstrology: boolean;
  canUseSpecializedSpreads: boolean;
  unlimitedReadings: boolean;
  dailyReadingLimits: Partial<Record<SpreadAccess, number>>;
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
    canUseLenormand: false,
    canUseAstrology: false,
    canUseSpecializedSpreads: false,
    unlimitedReadings: false,
    dailyReadingLimits: {},
    historyLimit: 0,
    modelTier: "free"
  },
  plus: {
    allowedPresets: ["three", "six", "celtic"],
    canUseReadingStyles: true,
    canUseLenormand: false,
    canUseAstrology: false,
    canUseSpecializedSpreads: false,
    unlimitedReadings: false,
    dailyReadingLimits: { six: 3, celtic: 1 },
    historyLimit: 5,
    modelTier: "premium"
  },
  pro: {
    allowedPresets: ["three", "six", "celtic"],
    canUseReadingStyles: true,
    canUseLenormand: true,
    canUseAstrology: false,
    canUseSpecializedSpreads: false,
    unlimitedReadings: false,
    dailyReadingLimits: { six: 5, celtic: 3 },
    historyLimit: 10,
    modelTier: "premium"
  },
  pro_max: {
    allowedPresets: ["three", "six", "celtic", ...SPECIALIZED_PRESETS],
    canUseReadingStyles: true,
    canUseLenormand: true,
    canUseAstrology: true,
    canUseSpecializedSpreads: true,
    unlimitedReadings: true,
    dailyReadingLimits: {},
    historyLimit: 25,
    modelTier: "premium"
  },
  admin: {
    allowedPresets: ["three", "six", "celtic", ...SPECIALIZED_PRESETS],
    canUseReadingStyles: true,
    canUseLenormand: true,
    canUseAstrology: true,
    canUseSpecializedSpreads: true,
    unlimitedReadings: true,
    dailyReadingLimits: {},
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
    modelLabel: "Đọc bài Sol hoặc model tiêu chuẩn",
    historyLabel: "Không lưu lịch sử",
    features: [
      "Trải bài 3 lá",
      "Đọc bài bằng model tiêu chuẩn",
      "Tốc độ xử lý chậm"
    ],
    unavailable: ["Phong cách đọc bài", "Trải bài 6, 10 lá và chuyên sâu"]
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
      "Trải bài 3 lá",
      "Trải bài 6 lá (3 trải/ngày)",
      "Trải bài 10 lá (1 trải/ngày)",
      "Đầy đủ phong cách đọc bài",
      "Lưu 5 lịch sử trải bài"
    ],
    unavailable: ["Các trải bài chuyên sâu", "Lenormand"],
    featured: true
  },
  pro: {
    id: "pro",
    name: "Pro",
    shortDescription: "Bộ công cụ mở rộng cho nhu cầu đọc bài thường xuyên.",
    weeklyPriceLabel: "39.000đ/tuần",
    monthlyPriceLabel: "119.900đ/tháng",
    modelLabel: "Đọc bài bằng model hiện đại nhất",
    historyLabel: "Lưu 10 trải bài",
    features: [
      "Toàn bộ quyền lợi Plus",
      "Trải bài 6 lá (5 trải/ngày)",
      "Trải bài 10 lá (3 trải/ngày)",
      "Trải bài Lenormand",
      "Lưu 10 lịch sử trải bài"
    ],
    unavailable: ["Các trải bài chuyên sâu", "Không giới hạn lượt trải bài"]
  },
  pro_max: {
    id: "pro_max",
    name: "Pro Max",
    shortDescription: "Mở toàn bộ dịch vụ hiện tại và các công cụ cao cấp.",
    weeklyPriceLabel: "59.000đ/tuần",
    monthlyPriceLabel: "239.990đ/tháng",
    modelLabel: "Đọc bài bằng model hiện đại nhất",
    historyLabel: "Lưu trên 20 trải bài",
    features: [
      "Toàn bộ quyền lợi Pro",
      "Các trải bài chuyên sâu",
      "Bản đồ sao",
      "Ưu tiên sử dụng các dịch vụ mới trước",
      "Không giới hạn lượt trải bài"
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

export function getDailyReadingLimit(access: PlanAccess, preset: SpreadAccess) {
  if (access.unlimitedReadings) return null;
  const limit = access.dailyReadingLimits[preset];
  return typeof limit === "number" && limit > 0 ? limit : null;
}

export function validatePlanReading(
  access: PlanAccess,
  preset: unknown,
  cardCount: number,
  readingStyle: unknown
) {
  const normalizedPreset = typeof preset === "string" && ["three", "six", "celtic", ...SPECIALIZED_PRESETS].includes(preset as SpreadAccess)
    ? preset as SpreadAccess
    : null;
  const expectedCounts: Partial<Record<SpreadAccess, number>> = {
    three: 3,
    six: 6,
    celtic: 10,
    future_love: 6,
    zodiac_houses: 12,
    health_overview: 6,
    tree_of_life: 10,
    matrix_3x3: 9
  };

  if (!normalizedPreset || !access.allowedPresets.includes(normalizedPreset)) {
    return "Gói hiện tại không hỗ trợ kiểu trải bài này. Hãy nâng cấp gói để tiếp tục.";
  }
  if (expectedCounts[normalizedPreset] !== cardCount) {
    return "Số lá không khớp với kiểu trải bài đã chọn.";
  }
  if (!access.canUseReadingStyles && typeof readingStyle === "string" && readingStyle.trim()) {
    return "Gói Free không hỗ trợ phong cách đọc bài. Hãy nâng cấp gói để sử dụng tính năng này.";
  }
  return null;
}
