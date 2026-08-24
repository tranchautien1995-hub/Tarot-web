# Tarot Practice V2.23 — Reader Mode Refinement

V2.23 chuyển phần AI từ giọng "luyện đọc Tarot" sang trải nghiệm Tarot Reader thực sự và tiếp tục tinh chỉnh để gần phong cách ChatGPT Plus hơn.

## Thay đổi chính

- Bỏ hoàn toàn câu "Tôi đang luyện trải bài Tarot" khỏi prompt AI và prompt sao chép cho ChatGPT Plus.
- System prompt đặt AI vào vai Tarot Reader, không phải giáo viên/chấm bài.
- Dùng vị trí lá để suy luận nhưng tránh lặp máy móc kiểu "The Hanged Man ở vị trí Điều đang ảnh hưởng..." trong bài đọc.
- Với câu hỏi về người khác, trả lời về người đó trước; lời khuyên cho người hỏi chỉ đến sau khi câu hỏi chính đã được trả lời.
- Hạn chế dựng chi tiết cụ thể không có trong spread; ví dụ thực tế chỉ ở dạng khả năng.
- Có thể dùng sự vắng mặt của suit/nhóm năng lượng như bằng chứng phụ, không dùng như bằng chứng tuyệt đối.
- Phân biệt rõ các mức độ như: còn nhớ ≠ nhớ nhung ≠ còn tình cảm ≠ muốn quay lại ≠ sẽ hành động.
- Giữ nguyên nguyên tắc A → B → C, mắt xích giữa các lá, giữ nghĩa tự nhiên của lá và lời khuyên phải bám spread.
- Đổi một số copy giao diện từ "luyện" sang trải bài thực tế: tagline, placeholder và lịch sử.

## API

Giữ nguyên cơ chế V2.22:

- XAH/OpenAI-compatible `/chat/completions`
- `stableai/gpt-5.6-sol` mặc định
- `reasoning_effort=medium` nếu gateway hỗ trợ; tự retry không có tham số nếu provider từ chối
- Hỏi tiếp AI giữ cấu trúc hội thoại system/user/assistant
