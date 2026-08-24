# Tarot Practice V2.25 — Prompt Reset / Plus-like Reader

V2.25 chủ động **giảm prompt** sau khi V2.24 bị over-prompt và tạo cảm giác phân tích kỹ thuật hơn ChatGPT Plus.

## Thay đổi chính

- Bỏ toàn bộ luật cưỡng ép như: phải tìm 1–3 cặp, phải có "cửa ải", phải đưa mọi vị trí vào phần tóm tắt, phải tạo chuỗi A → B → C.
- Giữ system prompt ngắn: đọc spread như một chỉnh thể, trả lời đúng câu hỏi, giữ nghĩa tự nhiên của lá, hạn chế suy diễn và không ép format.
- User prompt trở lại gần đúng câu lệnh đã tạo ra các bài đọc ChatGPT Plus trong Project.
- Bỏ `reasoning_effort` khỏi request. GPT-5.6 Sol được để chạy theo cấu hình mặc định của provider thay vì ép `medium`.
- Giữ hội thoại `system → user → assistant → user` cho chức năng hỏi tiếp.

Mục tiêu của V2.25 không phải bắt model tuân thủ nhiều quy tắc hơn mà là **để GPT-5.6 Sol tự tổng hợp tự nhiên hơn**, gần trải nghiệm ChatGPT Plus hơn.
