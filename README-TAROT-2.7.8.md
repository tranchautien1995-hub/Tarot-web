# Tarot 2.7.8

Source: Tarot-2.7.7(1).zip do người dùng cung cấp.

- Sửa khung chứa cắt mất phần ghost outline vượt mép trái, chỉ trong chế độ chọn bài bằng chuột.
- Giữ ghost outline trong suốt cho đúng 5 lá ngoài cùng bên trái, hiện theo lá đang hover.
- Tăng độ nhô lên 36px và sửa CSS 2.7.6 có độ ưu tiên cao khiến lá thường chỉ nhô 8px.
- Giữ nguyên kích thước, góc xoay, z-index và cơ chế kéo/chọn bài.
- Không thay đổi XAH/model, Supabase hoặc chức năng khác.
- Không đóng gói .env.local, node_modules hoặc dữ liệu build.

Kiểm tra: npm run typecheck và npm run build thành công. Build có cảnh báo CSS có sẵn về align-items:end. Chưa kiểm tra trực quan trong trình duyệt do tải Chromium bị timeout.
