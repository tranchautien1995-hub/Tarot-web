# TTarot WebVer1.8 · 2.7.56

Bản này phát triển trực tiếp từ WebVer1.7.

## Giao diện

- Bỏ mục `Tùy chọn` khỏi khu vực chọn kiểu trải.
- Thay bằng nút `Xem thêm`.
- Danh sách `Xem thêm` có mô tả dạng popup khi rê chuột hoặc dùng phím Tab.
- Dark và Light đều có màu riêng đồng bộ với giao diện chính.
- Ma trận 3×3, 12 Nhà Hoàng Đạo và Cây Sự Sống có bố cục desktop phù hợp; mobile tiếp tục kéo ngang như bản trước.

## Trải bài mới

- Người yêu tương lai: 6 lá.
- 12 Nhà Hoàng Đạo: 12 lá.
- Tổng quan sức khỏe: 6 lá.
- Cây Sự Sống: 10 lá.
- Ma trận 3×3: 9 lá.

Người yêu tương lai, 12 Nhà Hoàng Đạo, Tổng quan sức khỏe và Cây Sự Sống tự dùng câu hỏi đã được xây trong các vị trí nên ô câu hỏi bị khóa với dòng `Trải bài này không cần câu hỏi cụ thể`. Ma trận 3×3 vẫn cho nhập câu hỏi vì cần một tình huống làm trọng tâm.

Các trải bài chuyên sâu dành cho Pro, Pro Max và Admin. Tài khoản Free/Plus có thể xem danh sách; khi chọn sẽ được đưa tới trang nâng cấp.

## Prompt

Mỗi trải bài mới có chỉ dẫn suy luận riêng trong `lib/prompts.ts`. Prompt ưu tiên liên kết giữa các vị trí, dùng ngôn ngữ đời thường và tránh cách viết học thuật hoặc sách vở. Trải sức khỏe chỉ dùng để phản chiếu việc tự chăm sóc, không chẩn đoán hay thay thế tư vấn y khoa.

Không thay đổi model, XAH router, Supabase, SePay, bộ 78 lá hoặc các prompt phong cách đọc đã có.
