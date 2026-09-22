# Tarot 2.7.18

Tiếp tục trực tiếp từ Tarot 2.7.17.

## Thay đổi

- Chỉ tái cấu trúc Reader prompt của phong cách “Thẳng thắn, lạnh lùng, sâu sắc”.
- Khi chọn Thẳng thắn, prompt chung không còn yêu cầu giọng “tinh tế” hoặc buộc lặp nhiều từ giảm lực như “có thể”, “có khả năng”, “gợi ý”.
- Rút gọn phong cách thành các quy tắc ưu tiên cao: kết luận trước, câu ngắn, mỗi câu một ý, mỗi đoạn 2–4 câu.
- Cấm các kiểu mở đầu và chuyển đoạn mang giọng báo cáo như “năng lượng tổng thể”, “có dư địa” hoặc “điểm hỗ trợ nằm ở”.
- Điều có căn cứ được nói chắc; điều không được xác nhận chỉ bị chặn một lần bằng “Bài không xác nhận điều đó.”
- Thêm một mẫu nhịp văn để GPT-6 Astra bắt đúng độ lạnh và dứt khoát thay vì chỉ diễn giải các tính từ phong cách.
- Với câu hỏi phù hợp, Reader phải chỉ thẳng việc biến im lặng, tiềm năng hoặc sự bất mãn của người khác thành hy vọng.
- `## Tóm lại` bắt buộc đúng 6 câu; câu cuối đóng ở thực tế hiện tại và không để lại hy vọng dự phòng.

## Phạm vi giữ nguyên

- Giữ nguyên GPT-6 Astra, XAH `/chat/completions`, streaming, Supabase, quạt bài, UI và logic trải bài.
- Giữ nguyên từng ký tự của prompt Mặc định, Nhẹ nhàng và Tâm sự.
- Nút “Sao chép trải bài” tự động dùng prompt mới vì dùng chung bộ tạo prompt với API website.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- So sánh với 2.7.17 xác nhận chỉ `lib/prompts.ts`, số phiên bản và README mới thay đổi.
- Prompt Thẳng thắn không còn nhận ba chỉ dẫn chung gây xung đột: giọng “tinh tế”, yêu cầu dùng dày đặc ngôn ngữ điều kiện và phần kết 5–7 câu.
- Prompt Mặc định, Nhẹ nhàng và Tâm sự giữ nguyên từng ký tự.
- Nút “Sao chép trải bài” chứa đúng prompt Thẳng thắn mới.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
