# Tarot Practice V2.22 — Plus-like Reading Refinement

V2.22 tiếp tục tinh chỉnh chất lượng đọc bài GPT-5.6 Sol dựa trên so sánh trực tiếp giữa kết quả web V2.21 và cách đọc trong ChatGPT Plus.

## Thay đổi chính

- Giữ nghĩa tự nhiên của lá trước khi xét tác động của vị trí/câu hỏi.
- Tăng trọng số cho mạch chuyển động A → B → C và vai trò của "mắt xích" giữa các lá.
- Cho phép đưa 2–4 biểu hiện thực tế có điều kiện khi cần làm rõ một ý trừu tượng, nhưng không biến các ví dụ đó thành dữ kiện về người dùng.
- Hạn chế suy diễn bối cảnh cụ thể không được trải bài hỗ trợ.
- Mọi lời khuyên phải truy ngược được về lá lời khuyên/hướng phát triển hoặc mạch chung của spread.
- Không tự thêm hành động quá cụ thể như "công khai", "nghỉ việc", "đầu tư", "nhắn tin" nếu lá không hỗ trợ rõ.
- Với trải 3 lá, bài đọc được phép sâu hơn một chút để gần nhịp phân tích của ChatGPT Plus, nhưng tránh lặp ý.
- Mở bài tự nhiên hơn, không ép nhãn "Điểm đáng chú ý:".
- Không tự thêm checklist/câu hỏi phản tư cuối bài nếu người dùng không yêu cầu.

## API

Giữ nguyên cơ chế của V2.21:

- XAH/OpenAI-compatible `/chat/completions`
- `stableai/gpt-5.6-sol` mặc định
- `reasoning_effort=medium` nếu gateway hỗ trợ; tự retry không có tham số nếu provider từ chối
- Hỏi tiếp AI giữ cấu trúc hội thoại system/user/assistant
