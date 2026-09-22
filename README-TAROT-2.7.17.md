# Tarot 2.7.17

Tiếp tục trực tiếp từ Tarot 2.7.16.

## Thay đổi

- Chỉ tinh chỉnh Reader prompt của phong cách “Thẳng thắn, lạnh lùng, sâu sắc”.
- Buộc mở đầu đi thẳng vào kết luận bằng ngôn ngữ tự nhiên, thay vì mở bằng giọng phân tích xa cách.
- Ưu tiên câu ngắn, mỗi câu một ý chính và đoạn văn 2–4 câu để tạo nhịp lạnh, chắc, gần chất GPT-5.6 Sol hơn.
- Hạn chế các công thức học thuật như “kết hợp với”, “bổ sung một điểm”, “khi đặt cạnh” hoặc “điều này gợi ý rằng”.
- Điều lá bài hỗ trợ được nói dứt khoát; điều không được xác nhận bị chặn bằng một câu riêng, không lặp cảnh báo và không suy diễn thêm.
- Tiếp tục phân biệt rõ cảm xúc, mong muốn, ý định và hành động.
- Phần `## Tóm lại` phải gồm 5–7 câu ngắn; câu cuối đóng vấn đề ở thực tế hiện tại, không mở thêm khả năng hoặc gieo hy vọng dự phòng.

## Phạm vi giữ nguyên

- Giữ nguyên GPT-6 Astra, XAH `/chat/completions`, streaming và cấu hình môi trường.
- Giữ nguyên Supabase, quạt bài, giao diện, logic trải bài và ba cách đọc còn lại.
- Nút “Sao chép trải bài” tự động nhận prompt mới vì dùng chung bộ tạo prompt với API website.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- So sánh với Tarot 2.7.16 xác nhận chỉ `lib/prompts.ts`, số phiên bản và README mới thay đổi.
- Kiểm tra hợp đồng prompt xác nhận Mặc định, Nhẹ nhàng và Tâm sự giữ nguyên từng ký tự; chỉ Thẳng thắn được cập nhật.
- Nút “Sao chép trải bài” chứa đúng prompt Thẳng thắn mới.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
