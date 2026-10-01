import type { LenormandCard } from "./types";

const card = (number: number, id: string, name: string, vi: string, symbol: string, playingCard: string, keywords: string[], tone: LenormandCard["tone"]): LenormandCard => ({ number, id, name, vi, symbol, playingCard, keywords, tone });

export const LENORMAND_DECK: LenormandCard[] = [
  card(1,"rider","Rider","Kỵ sĩ","♞","9♥",["tin đến","chuyển động","người ghé"],"positive"),
  card(2,"clover","Clover","Cỏ bốn lá","♣","6♦",["may mắn nhỏ","cơ hội","ngắn hạn"],"positive"),
  card(3,"ship","Ship","Con thuyền","⛵","10♠",["hành trình","xa cách","mở rộng"],"neutral"),
  card(4,"house","House","Ngôi nhà","⌂","K♥",["gia đình","nền tảng","an toàn"],"positive"),
  card(5,"tree","Tree","Cây","♧","7♥",["sức khỏe","gốc rễ","phát triển chậm"],"neutral"),
  card(6,"clouds","Clouds","Mây","☁","K♣",["mơ hồ","bối rối","thiếu rõ ràng"],"challenging"),
  card(7,"snake","Snake","Rắn","〰","Q♣",["phức tạp","đường vòng","người khó lường"],"challenging"),
  card(8,"coffin","Coffin","Quan tài","▰","9♦",["kết thúc","dừng lại","mất mát"],"challenging"),
  card(9,"bouquet","Bouquet","Bó hoa","✿","Q♠",["niềm vui","quà tặng","sự duyên dáng"],"positive"),
  card(10,"scythe","Scythe","Lưỡi hái","⚔","J♦",["cắt bỏ","quyết định nhanh","nguy cơ"],"challenging"),
  card(11,"whip","Whip","Roi","⌇","J♣",["lặp lại","tranh luận","căng thẳng"],"challenging"),
  card(12,"birds","Birds","Chim","⌁","7♦",["trò chuyện","lo lắng","hai người"],"neutral"),
  card(13,"child","Child","Đứa trẻ","◌","J♠",["khởi đầu","nhỏ bé","non kinh nghiệm"],"positive"),
  card(14,"fox","Fox","Cáo","◇","9♣",["công việc","thận trọng","mưu mẹo"],"challenging"),
  card(15,"bear","Bear","Gấu","⬟","10♣",["quyền lực","tài chính","người bảo trợ"],"neutral"),
  card(16,"stars","Stars","Những vì sao","✦","6♥",["định hướng","hy vọng","mạng lưới"],"positive"),
  card(17,"stork","Stork","Cò","♢","Q♥",["thay đổi","chuyển dịch","cải thiện"],"positive"),
  card(18,"dog","Dog","Chó","♙","10♥",["bạn bè","trung thành","hỗ trợ"],"positive"),
  card(19,"tower","Tower","Tòa tháp","▥","6♠",["tổ chức","ranh giới","cô lập"],"neutral"),
  card(20,"garden","Garden","Khu vườn","❀","8♠",["xã hội","công chúng","sự kiện"],"positive"),
  card(21,"mountain","Mountain","Núi","▲","8♣",["trở ngại","trì hoãn","khoảng cách"],"challenging"),
  card(22,"crossroads","Crossroads","Ngã rẽ","⋔","Q♦",["lựa chọn","nhiều hướng","quyết định"],"neutral"),
  card(23,"mice","Mice","Chuột","♨","7♣",["hao hụt","lo âu","xói mòn"],"challenging"),
  card(24,"heart","Heart","Trái tim","♥","J♥",["tình yêu","cảm xúc","điều yêu thích"],"positive"),
  card(25,"ring","Ring","Chiếc nhẫn","○","A♣",["cam kết","hợp đồng","chu kỳ"],"positive"),
  card(26,"book","Book","Quyển sách","▤","10♦",["bí mật","kiến thức","điều chưa biết"],"neutral"),
  card(27,"letter","Letter","Lá thư","✉","7♠",["văn bản","tin nhắn","giấy tờ"],"neutral"),
  card(28,"man","Man","Người nam","♂","A♥",["người đại diện nam","nhân vật chính"],"neutral"),
  card(29,"woman","Woman","Người nữ","♀","A♠",["người đại diện nữ","nhân vật chính"],"neutral"),
  card(30,"lily","Lily","Hoa ly","⚜","K♠",["trưởng thành","bình yên","đạo đức"],"positive"),
  card(31,"sun","Sun","Mặt trời","☀","A♦",["thành công","sức sống","rõ ràng"],"positive"),
  card(32,"moon","Moon","Mặt trăng","☾","8♥",["công nhận","cảm xúc","danh tiếng"],"neutral"),
  card(33,"key","Key","Chìa khóa","⚿","8♦",["chắc chắn","mở khóa","giải pháp"],"positive"),
  card(34,"fish","Fish","Cá","♓","K♦",["tiền bạc","dòng chảy","kinh doanh"],"positive"),
  card(35,"anchor","Anchor","Mỏ neo","⚓","9♠",["ổn định","công việc","bền vững"],"positive"),
  card(36,"cross","Cross","Thập giá","✚","6♣",["gánh nặng","thử thách","điều phải đối diện"],"challenging")
];

export const HOUSE_NAMES = LENORMAND_DECK.map((item) => `${item.number}. ${item.vi}`);

export function shuffleLenormand() {
  const next = [...LENORMAND_DECK];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
