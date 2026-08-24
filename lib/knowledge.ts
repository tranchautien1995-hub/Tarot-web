export const PERSONAL_TAROT_KNOWLEDGE: Record<string, string> = {
  "The Fool": `Trọng tâm học: khởi đầu, khám phá và cởi mở với trải nghiệm mới. The Fool chưa có đủ công cụ hay trải nghiệm; năng lượng nằm ở bước chân đầu tiên và niềm tin. Khi ngược, cần phân biệt tự do với bốc đồng hoặc bắt đầu khi chưa chuẩn bị.`,
  "The Magician": `Trọng tâm học: ý chí, manifestation, kỹ năng, giao tiếp và chủ động. Đứng sau The Fool vì The Fool còn khám phá còn Magician đã có đủ công cụ để hành động. Wands=hành động, Cups=cảm xúc, Swords=tư duy, Pentacles=thực tế. Lời khuyên thường là bắt đầu ngay khi nền tảng đã đủ, thay vì overthinking.`,
  "The High Priestess": `Trọng tâm học: trực giác, cảm nhận, chiêm nghiệm và tĩnh lại trước quyết định. Sau Magician, lá này nhắc không phải lúc nào có công cụ cũng nên hành động ngay; còn những điều chưa biết cần quan sát. Trong tình cảm, có thể khuyên tiếp tục quan sát, hỏi trực tiếp và kiểm chứng trực giác thay vì kết luận vội.`,
  "The Empress": `Trọng tâm học: nuôi dưỡng. Hình ảnh thiên nhiên nhấn mạnh chăm sóc, phát triển và tận hưởng giá trị đang được tạo ra. Trong tình cảm có mặt tích cực là chăm sóc và tiềm năng gắn bó, nhưng bóng tối là phụ thuộc cảm xúc đối phương hoặc đánh mất tính chân thực của mình.`,
  "The Emperor": `Trọng tâm học: “I build” — xây cấu trúc để bảo vệ và duy trì điều Empress đã tạo ra. Kỷ luật, kế hoạch dài hạn, phân quyền và hệ thống. Bóng tối: cứng nhắc, quyết định thay người khác, áp đặt cách làm của mình. Khi ứng dụng nên tạo hệ thống nhưng vẫn giao tiếp và cho người khác không gian.`,
  "The Hierophant": `Trọng tâm học: truyền thống, hệ giá trị, niềm tin, người hướng dẫn và tri thức được truyền lại. Có thể nói về gia đình hoặc khuôn mẫu xã hội, cũng có thể là một mentor/teacher đáng tin. Mặt bóng cần chú ý là bị ép theo con đường không phù hợp hoặc tiếp nhận cách dạy/niềm tin của người khác một cách máy móc. Khi là lời khuyên, ưu tiên học từ một nguồn đáng tin nhưng vẫn giữ khả năng tự kiểm chứng.`,
  "The Lovers": `Trọng tâm học: không chỉ là tình yêu mà còn là lựa chọn dựa trên hệ giá trị. Có thể phản ánh câu hỏi: giữ vững giá trị sống của mình hay đi theo giá trị của người yêu? Trong tình cảm, chiều ngược đặc biệt có thể nói về xung đột tam quan, lệch nguyên tắc sống hoặc bỏ quên giá trị bản thân để chạy theo lợi ích/cảm xúc trước mắt. Việc chọn nên dựa vào quan điểm, sở thích và nguyên tắc sống của người hỏi, không phải chỉ cảm xúc tức thời.`
};

export function knowledgeForCards(names: string[]) {
  return names
    .filter((name) => PERSONAL_TAROT_KNOWLEDGE[name])
    .map((name) => `### ${name}\n${PERSONAL_TAROT_KNOWLEDGE[name]}`)
    .join("\n\n");
}
