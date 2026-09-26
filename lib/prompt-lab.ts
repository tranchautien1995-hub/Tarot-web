import type { SpreadAccess } from "./plans";

export type PromptLabSpread = {
  id: SpreadAccess;
  label: string;
  count: number;
  questionMode: "required" | "none";
  positions: string[];
};

export const PROMPT_LAB_SPREADS: PromptLabSpread[] = [
  {
    id: "three",
    label: "3 lá",
    count: 3,
    questionMode: "required",
    positions: ["Bản chất vấn đề", "Điều đang ảnh hưởng", "Hướng phát triển / lời khuyên"]
  },
  {
    id: "six",
    label: "6 lá",
    count: 6,
    questionMode: "required",
    positions: ["Hiện trạng", "Gốc rễ", "Điều hỗ trợ", "Trở ngại", "Lời khuyên", "Xu hướng phát triển"]
  },
  {
    id: "celtic",
    label: "10 lá · Celtic Cross",
    count: 10,
    questionMode: "required",
    positions: [
      "Hiện tại / trọng tâm", "Thử thách / điều cản trở", "Điều bạn ý thức / mục tiêu",
      "Nền tảng / gốc rễ", "Quá khứ gần", "Xu hướng sắp tới", "Bạn trong tình huống",
      "Môi trường / người xung quanh", "Hy vọng và nỗi sợ", "Kết quả / hướng phát triển"
    ]
  },
  {
    id: "future_love",
    label: "6 lá · Người yêu tương lai",
    count: 6,
    questionMode: "none",
    positions: [
      "Người yêu tương lai của bạn là người như thế nào?", "Người đó đã xuất hiện trong cuộc sống của bạn chưa?",
      "Dấu hiệu giúp bạn nhận ra họ", "Hai người sẽ đối xử với nhau như thế nào?",
      "Mối quan hệ này mở ra điều gì mới?", "Tiềm năng gắn bó lâu dài"
    ]
  },
  {
    id: "zodiac_houses",
    label: "12 lá · 12 Nhà Hoàng Đạo",
    count: 12,
    questionMode: "none",
    positions: [
      "Nhà 1 · Bản thân, tính cách, tham vọng và cơ thể", "Nhà 2 · Vật chất và tài chính",
      "Nhà 3 · Giao tiếp, suy nghĩ, học hỏi và quan hệ gần", "Nhà 4 · Gia đình, bố mẹ và gốc rễ",
      "Nhà 5 · Sáng tạo, tình cảm, sở thích và con cái", "Nhà 6 · Công việc hằng ngày, trách nhiệm, thói quen và sức khỏe",
      "Nhà 7 · Quan hệ tình cảm, cam kết và đối tác", "Nhà 8 · Tài sản chung, nợ, thừa kế và trách nhiệm",
      "Nhà 9 · Niềm tin, học cao hơn và hành trình xa", "Nhà 10 · Sự nghiệp, hình ảnh cá nhân và cấp trên",
      "Nhà 11 · Bạn bè, cộng đồng, hy vọng và mục tiêu", "Nhà 12 · Nội tâm, điều kín, giới hạn và tiềm thức"
    ]
  },
  {
    id: "health_overview",
    label: "6 lá · Tổng quan sức khỏe",
    count: 6,
    questionMode: "none",
    positions: [
      "Thể trạng hiện tại", "Mức năng lượng và sức bền", "Tinh thần và áp lực đang ảnh hưởng",
      "Thói quen đang hỗ trợ sức khỏe", "Điều cần chú ý hoặc thay đổi", "Hướng chăm sóc bản thân"
    ]
  },
  {
    id: "tree_of_life",
    label: "10 lá · Cây Sự Sống",
    count: 10,
    questionMode: "none",
    positions: [
      "Cốt lõi con người bạn", "Nguồn lực bên trong", "Điều đang thúc đẩy bạn", "Điều đang cản trở bạn",
      "Niềm tin và cách bạn suy nghĩ", "Cảm xúc sâu bên trong", "Bài học từ quá khứ",
      "Cách bạn đang thể hiện ra ngoài", "Hướng phát triển phù hợp", "Điều cần kết nối và đưa vào hành động"
    ]
  },
  {
    id: "matrix_3x3",
    label: "9 lá · Ma trận 3×3",
    count: 9,
    questionMode: "required",
    positions: [
      "Quá khứ · Nền tảng của tình huống", "Quá khứ · Ảnh hưởng còn kéo dài", "Quá khứ · Điều chưa được giải quyết",
      "Hiện tại · Trọng tâm", "Hiện tại · Nút thắt chính", "Hiện tại · Nguồn lực có thể dùng",
      "Hướng phát triển · Điều đang hình thành", "Hướng phát triển · Việc cần làm", "Hướng phát triển · Kết quả có điều kiện"
    ]
  }
];

export function getPromptLabSpread(value: unknown) {
  return PROMPT_LAB_SPREADS.find((spread) => spread.id === value) ?? null;
}
