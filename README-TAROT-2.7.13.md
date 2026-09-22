# Tarot 2.7.13

Tiếp tục từ Tarot 2.7.12.

- Nút “Sao chép trải bài” nay sao chép toàn bộ prompt dùng trong website thay vì chỉ tên phong cách.
- Nội dung sao chép gồm nguyên bộ quy tắc Reader chung, quy tắc Celtic Cross khi áp dụng, toàn bộ chỉ dẫn của phong cách đang chọn, câu hỏi, vị trí, tên lá và chiều xuôi/ngược.
- Không chọn phong cách thì nội dung sao chép dùng đúng prompt mặc định, không chèn chỉ dẫn của ba phong cách.
- Prompt được bọc bằng hướng dẫn rõ ràng để có thể dán vào một cuộc trò chuyện ChatGPT mới và yêu cầu đọc ngay.
- Đồng bộ tên phong cách “Thẳng thắn, lạnh lùng, sâu sắc” giữa giao diện, API và nội dung sao chép.
- Giữ nguyên XAH, model stableai/gpt-5.6-sol, Supabase và các chức năng khác.
- ZIP không chứa .env.local, node_modules hoặc dữ liệu build.

Kiểm tra: TypeScript và production build thành công. Kiểm tra hợp đồng xác nhận nội dung sao chép chứa nguyên văn prompt hệ thống và prompt dữ liệu mà website dùng cho cả bốn chế độ mặc định, thẳng thắn, nhẹ nhàng và tâm sự; chế độ mặc định không chứa chỉ dẫn phong cách.
