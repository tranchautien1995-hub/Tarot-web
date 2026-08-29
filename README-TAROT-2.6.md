# Tarot-2.6 — Reader Synthesis

Base: Tarot-2.5 Sponsor Gate.

## Thay đổi duy nhất
Chỉnh `lib/prompts.ts` bằng 3 guardrail ngắn để phần đọc gần cách tổng hợp của ChatGPT Plus hơn:

- Ưu tiên đọc các lá thành mạch **nguyên nhân → trạng thái → phản ứng → xu hướng** khi trải bài thực sự hỗ trợ.
- Khi có ý nghĩa, liên kết cả các lá ở xa nhau, đặc biệt **lá mở đầu ↔ lá xu hướng/kết quả**, để thấy đường phát triển chung thay vì chỉ đi từng lá.
- Không cụ thể hóa thành trạng thái tâm lý, động cơ hay kịch bản riêng nếu lá bài chỉ hỗ trợ một ý rộng hơn.

## Mục tiêu
Giảm cảm giác “mỗi lá một đoạn”, tăng câu chuyện chung và giảm suy diễn quá cụ thể.

## Giữ nguyên
- Sponsor Gate Shopee của Tarot-2.5
- giao diện và tối ưu hiệu năng
- shuffle / random draw
- logic chọn bài
- logic xuôi/ngược
- `app/api/read/route.ts`
- `app/api/chat/route.ts`
- `lib/xah.ts`
