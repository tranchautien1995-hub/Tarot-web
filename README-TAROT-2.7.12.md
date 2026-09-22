# Tarot 2.7.12

Tiếp tục từ Tarot 2.7.11.

- Mặc định không chọn phong cách nào và giữ nguyên bộ prompt đọc bài trước khi có ba phong cách.
- Người dùng chỉ áp dụng phong cách khi bấm chọn một trong ba nút; bấm lại nút đang chọn để trở về cách đọc mặc định.
- “Thẳng thắn” được bổ sung giọng lạnh, điềm tĩnh, sắc và dứt khoát; không xoa dịu hoặc bọc kết luận khó bằng lời dễ nghe.
- Phong cách thẳng thắn vẫn cấm chế giễu, hạ nhục, công kích, dọa nạt và suy diễn thiếu căn cứ.
- Tăng kích thước và độ đậm chữ trên ba nút; tăng chữ tooltip để dễ đọc hơn.
- Lịch sử cũ không có phong cách tiếp tục dùng cách đọc mặc định.
- Giữ nguyên XAH, model stableai/gpt-5.6-sol, Supabase và các chức năng khác.
- ZIP không chứa .env.local, node_modules hoặc dữ liệu build.

Kiểm tra: TypeScript và production build thành công. Prompt mặc định không chứa chỉ dẫn phong cách; prompt thẳng thắn chứa đúng chỉ dẫn lạnh và dứt khoát. Trên Chromium, cả ba nút mặc định đều chưa chọn, bấm lần hai bỏ chọn thành công, tooltip đúng nội dung và chữ desktop đạt 13px/600.
