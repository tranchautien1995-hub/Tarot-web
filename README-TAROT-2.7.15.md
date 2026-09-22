# Tarot 2.7.15

Tiếp tục trực tiếp từ Tarot 2.7.14.

## Thay đổi

- Tăng rõ độ lạnh, sắc và dứt khoát của phong cách “Thẳng thắn, lạnh lùng, sâu sắc”.
- Buộc bài đọc chốt kết luận chính ngay 1–2 câu đầu, không dẫn nhập hoặc xoa dịu trước.
- Giảm lạm dụng các từ làm yếu giọng như “có thể”, “có lẽ”, “có khả năng”, nhưng vẫn giữ giới hạn của Tarot và không khẳng định điều bài không hỗ trợ.
- Phân biệt rõ cảm xúc, mong muốn, ý định và hành động để tránh nuôi hy vọng từ tín hiệu mơ hồ.
- Khi có căn cứ, Reader sẽ chỉ thẳng việc bám vào im lặng, chờ đợi hoặc tự diễn giải tín hiệu để giúp querent nhìn lại thực tế.
- Phần “Tóm lại” được yêu cầu trở thành cú chốt lạnh, có sức nặng, nêu tiêu chuẩn hành động đáng tin và trả quyền quyết định về cho querent.
- “Thức tỉnh” được giới hạn theo hướng giúp querent nhìn đúng thực tế; không hạ nhục, công kích, dọa nạt, ra lệnh cực đoan hoặc khiến họ phụ thuộc vào Tarot.

## Phạm vi giữ nguyên

- Không thay đổi cách đọc mặc định, “Nhẹ nhàng” hoặc “Tâm sự”.
- Không thay đổi GPT-6 Astra, router XAH `/chat/completions`, Supabase, giao diện hoặc các chức năng trải bài.
- Nút “Sao chép trải bài” tự động nhận đúng prompt mới vì dùng chung bộ tạo prompt với API của website.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Kiểm tra hợp đồng prompt xác nhận chỉ phong cách “Thẳng thắn” thay đổi; cách đọc mặc định, “Nhẹ nhàng” và “Tâm sự” giữ nguyên từng ký tự.
- Nội dung từ nút “Sao chép trải bài” chứa đầy đủ prompt “Thẳng thắn” mới.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
