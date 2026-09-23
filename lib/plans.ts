export type PlanId = "free" | "plus" | "pro" | "pro_max";

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
