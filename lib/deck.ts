import type { DrawnCard, Orientation, TarotCard } from "./types";

const major: TarotCard[] = [
  ["00","The Fool","Kẻ Khờ","✦",["khởi đầu","tự do","cởi mở","khám phá"],["bốc đồng","thiếu chuẩn bị","niềm tin mù quáng"]],
  ["01","The Magician","Nhà Ảo Thuật","∞",["ý chí","hiện thực hóa","kỹ năng","chủ động"],["phân tán","thao túng","không dùng hết năng lực"]],
  ["02","The High Priestess","Nữ Tư Tế","☾",["trực giác","tĩnh lặng","quan sát","bí ẩn"],["phớt lờ trực giác","bối rối","bí mật"]],
  ["03","The Empress","Hoàng Hậu","♀",["nuôi dưỡng","sáng tạo","sung túc","chăm sóc"],["phụ thuộc","bỏ quên bản thân","chăm sóc quá mức"]],
  ["04","The Emperor","Hoàng Đế","♈",["cấu trúc","kỷ luật","lãnh đạo","ổn định"],["cứng nhắc","kiểm soát","độc đoán"]],
  ["05","The Hierophant","Giáo Hoàng","⚜",["truyền thống","hệ thống","người thầy","niềm tin"],["phá khuôn","giáo điều","xung đột chuẩn mực"]],
  ["06","The Lovers","Tình Nhân","♡",["tình yêu","lựa chọn","hòa hợp","giá trị"],["lệch giá trị","xung đột","lựa chọn khó","mất kết nối"]],
  ["07","The Chariot","Cỗ Xe","✧",["ý chí","tiến lên","kiểm soát hướng đi","quyết tâm"],["mất hướng","nóng vội","xung đột ý chí"]],
  ["08","Strength","Sức Mạnh","♌",["nội lực","kiên nhẫn","can đảm","điều hòa bản năng"],["tự ti","mất kiểm soát","kiệt sức"]],
  ["09","The Hermit","Ẩn Sĩ","☼",["chiêm nghiệm","tìm kiếm bên trong","tĩnh tâm","dẫn đường"],["cô lập","né tránh","thu mình quá mức"]],
  ["10","Wheel of Fortune","Bánh Xe Số Phận","◉",["chu kỳ","bước ngoặt","thay đổi","cơ hội"],["trì hoãn","kháng cự thay đổi","chu kỳ khó"]],
  ["11","Justice","Công Lý","⚖",["công bằng","trách nhiệm","sự thật","hệ quả"],["thiên lệch","né trách nhiệm","bất công"]],
  ["12","The Hanged Man","Người Treo Ngược","▽",["đổi góc nhìn","tạm dừng","buông","hy sinh có ý thức"],["trì hoãn vô ích","mắc kẹt","không chịu buông"]],
  ["13","Death","Cái Chết","☠",["kết thúc","chuyển hóa","buông cũ","tái sinh"],["bám víu","sợ thay đổi","chuyển hóa chậm"]],
  ["14","Temperance","Tiết Chế","⚗",["cân bằng","điều hòa","kiên nhẫn","hòa hợp"],["quá đà","mất cân bằng","thiếu phối hợp"]],
  ["15","The Devil","Ác Quỷ","♑",["ràng buộc","ham muốn","bóng tối","phụ thuộc"],["giải phóng","nhận diện xiềng xích","thoát lệ thuộc"]],
  ["16","The Tower","Tòa Tháp","⚡",["đổ vỡ","sự thật bất ngờ","giải phóng","tái cấu trúc"],["né khủng hoảng","sợ thay đổi","đổ vỡ âm ỉ"]],
  ["17","The Star","Ngôi Sao","★",["hy vọng","chữa lành","niềm tin","cảm hứng"],["mất niềm tin","bi quan","khó kết nối hy vọng"]],
  ["18","The Moon","Mặt Trăng","☽",["mơ hồ","tiềm thức","trực giác","ảo ảnh"],["bóc tách ảo tưởng","sợ hãi lộ diện","bối rối"]],
  ["19","The Sun","Mặt Trời","☀",["rõ ràng","niềm vui","sức sống","thành công"],["niềm vui bị che khuất","quá lạc quan","chậm tỏa sáng"]],
  ["20","Judgement","Phán Xét","♬",["thức tỉnh","đánh giá lại","tiếng gọi","tha thứ"],["tự phán xét","né tiếng gọi","nghi ngờ bản thân"]],
  ["21","The World","Thế Giới","◎",["hoàn tất","tích hợp","thành tựu","trọn vẹn"],["chưa khép vòng","thiếu hoàn tất","trì hoãn kết thúc"]]
].map(([n,name,vi,symbol,upright,reversed]) => ({
  id:`major-${n}`, name:name as string, vi:vi as string, arcana:"major" as const,
  symbol:symbol as string, upright:upright as string[], reversed:reversed as string[]
}));

const suits = {
  wands: { vi: "Gậy", symbol: "♨", upright: ["hành động","động lực","đam mê"], reversed: ["trì hoãn","mất lửa","hành động lệch hướng"] },
  cups: { vi: "Cốc", symbol: "♧", upright: ["cảm xúc","kết nối","trực giác"], reversed: ["cảm xúc tắc nghẽn","xa cách","quá nhạy cảm"] },
  swords: { vi: "Kiếm", symbol: "†", upright: ["tư duy","sự thật","quyết định"], reversed: ["rối trí","xung đột nội tâm","thiếu rõ ràng"] },
  pentacles: { vi: "Tiền", symbol: "⬟", upright: ["thực tế","tài chính","nền tảng"], reversed: ["bất ổn thực tế","quản trị kém","thiếu nền tảng"] }
} as const;

const ranks = [
  ["ace","Ace","Át",["khởi đầu","tiềm năng"],["cơ hội bị chặn","khởi đầu chậm"]],
  ["two","Two","Hai",["cân nhắc","đối cực"],["mất cân bằng","khó lựa chọn"]],
  ["three","Three","Ba",["phát triển","hợp tác"],["thiếu phối hợp","chậm phát triển"]],
  ["four","Four","Bốn",["ổn định","cấu trúc"],["trì trệ","bất ổn"]],
  ["five","Five","Năm",["thử thách","xáo trộn"],["hồi phục","xung đột kéo dài"]],
  ["six","Six","Sáu",["điều chỉnh","tiến triển"],["mắc lại quá khứ","tiến triển chậm"]],
  ["seven","Seven","Bảy",["đánh giá","thử thách niềm tin"],["nghi ngờ","thiếu chiến lược"]],
  ["eight","Eight","Tám",["chuyển động","làm chủ"],["tắc nghẽn","mất nhịp"]],
  ["nine","Nine","Chín",["gần hoàn tất","tự chủ"],["kiệt sức","thiếu bền bỉ"]],
  ["ten","Ten","Mười",["hoàn tất chu kỳ","kết quả"],["quá tải","chu kỳ chưa khép"]],
  ["page","Page","Tiểu Đồng",["học hỏi","thông điệp","tò mò"],["non nớt","tin nhiễu","thiếu tập trung"]],
  ["knight","Knight","Hiệp Sĩ",["theo đuổi","chuyển động","cam kết"],["nóng vội","cực đoan","thiếu hướng"]],
  ["queen","Queen","Nữ Hoàng",["làm chủ bên trong","chín chắn","tiếp nhận"],["mất cân bằng nội tâm","phụ thuộc","khép kín"]],
  ["king","King","Vua",["làm chủ","trách nhiệm","định hướng"],["lạm quyền","cứng nhắc","thiếu tự chủ"]]
] as const;

const minor: TarotCard[] = (Object.keys(suits) as Array<keyof typeof suits>).flatMap((suit) => {
  const s = suits[suit];
  return ranks.map(([rank,name,vi,uExtra,rExtra]) => ({
    id: `${suit}-${rank}`,
    name: `${name} of ${suit[0].toUpperCase()+suit.slice(1)}`,
    vi: `${vi} ${s.vi}`,
    arcana: "minor" as const,
    suit,
    rank,
    symbol: s.symbol,
    upright: [...uExtra, ...s.upright],
    reversed: [...rExtra, ...s.reversed]
  }));
});

export const TAROT_DECK: TarotCard[] = [...major, ...minor];

export function spreadPositions(count: number): string[] {
  if (count === 1) return ["Thông điệp trọng tâm"];
  if (count === 3) return ["Bản chất vấn đề", "Điều đang ảnh hưởng", "Hướng phát triển / lời khuyên"];
  if (count === 6) return ["Hiện trạng", "Gốc rễ", "Điều hỗ trợ", "Trở ngại", "Lời khuyên", "Xu hướng phát triển"];
  return Array.from({ length: count }, (_, index) => `Vị trí ${index + 1}`);
}

export function randomOrientation(): Orientation {
  return Math.random() < 0.5 ? "upright" : "reversed";
}

export function drawCards(count: number): DrawnCard[] {
  const safeCount = Math.max(1, Math.min(78, Math.floor(count)));
  const deck = [...TAROT_DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const positions = spreadPositions(safeCount);
  return deck.slice(0, safeCount).map((card, index) => ({
    ...card,
    orientation: randomOrientation(),
    position: positions[index]
  }));
}

export function makeSelectedCard(card: TarotCard, index: number, count: number): DrawnCard {
  return {
    ...card,
    orientation: randomOrientation(),
    position: spreadPositions(count)[index] || `Vị trí ${index + 1}`
  };
}
