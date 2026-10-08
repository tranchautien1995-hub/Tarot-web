export type CombinedSpread = "contrast" | "deep" | "overview";
export const COMBINED_SPREADS = {
  contrast: {
    title: "Đối chiếu", description: "3 Tarot + 3 Lenormand",
    tarotPositions: ["Bản chất / hiện trạng sâu", "Điều đang tác động", "Xu hướng"],
    lenormandPositions: ["Biểu hiện thực tế", "Điều đang diễn ra / trở ngại", "Diễn biến gần"]
  },
  deep: {
    title: "Chuyên sâu", description: "5 Tarot + 5 Lenormand",
    tarotPositions: ["Hiện trạng", "Gốc rễ", "Điều ẩn bên dưới", "Trở ngại", "Xu hướng sâu"],
    lenormandPositions: ["Tình hình thực tế", "Tác động bên ngoài", "Giao tiếp / hành động", "Trở ngại thực tế", "Diễn biến"]
  },
  overview: {
    title: "Toàn cảnh", description: "3 Tarot + Lenormand 3×3",
    tarotPositions: ["Bản chất sâu của tình huống", "Mâu thuẫn / động lực chính", "Hướng phát triển lớn"],
    lenormandPositions: ["Hàng 1 · Cột 1", "Hàng 1 · Cột 2", "Hàng 1 · Cột 3", "Hàng 2 · Cột 1", "Trung tâm", "Hàng 2 · Cột 3", "Hàng 3 · Cột 1", "Hàng 3 · Cột 2", "Hàng 3 · Cột 3"]
  }
} satisfies Record<CombinedSpread, { title: string; description: string; tarotPositions: string[]; lenormandPositions: string[] }>;
export function isCombinedSpread(value: unknown): value is CombinedSpread {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(COMBINED_SPREADS, value);
}
