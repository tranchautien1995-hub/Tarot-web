# Tarot 2.7.10

Tiếp tục từ Tarot 2.7.9.

- Thay danh sách placeholder bằng 36 câu hỏi gợi ý ngẫu nhiên, tập trung chủ yếu vào người yêu cũ và crush.
- Thêm ba lựa chọn phong cách đọc dưới ô câu hỏi: Thẳng thắn, Nhẹ nhàng và Tâm sự.
- Khi rê chuột hoặc dùng bàn phím focus vào nút, giao diện hiển thị tên đầy đủ của phong cách đọc.
- Lựa chọn hiện chỉ là giao diện và trạng thái cục bộ; chưa tác động đến prompt hoặc cách GPT-5.6 Sol trả lời.
- Giữ nguyên XAH/model, Supabase và các chức năng khác.
- ZIP không chứa .env.local, node_modules hoặc dữ liệu build.

Kiểm tra: TypeScript và production build thành công. Đã kiểm tra trên Chromium: đủ ba nút, đổi lựa chọn hoạt động, tooltip hiển thị đúng nội dung và danh sách có đúng 36 câu hỏi.
