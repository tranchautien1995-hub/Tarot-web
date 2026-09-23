# TTarot 2.7.47 — sửa giọng đọc tiếng Việt

Phiên bản này phát triển trực tiếp từ Tarot 2.7.46.

## Thay đổi

- Chờ sự kiện `voiceschanged` thay vì lấy danh sách giọng quá sớm.
- Tự thử tải lại danh sách giọng ở nhiều mốc khi trang vừa mở.
- Chỉ sử dụng giọng có ngôn ngữ tiếng Việt (`vi` hoặc `vi-VN`).
- Thêm ô **Giọng Việt** để người dùng chọn khi thiết bị có nhiều giọng.
- Không dùng giọng mặc định tiếng Anh để đọc nội dung tiếng Việt.
- Hiển thị thông báo rõ nếu thiết bị chưa cài giọng tiếng Việt.
- Giữ chức năng tạm dừng, tiếp tục, dừng và chọn tốc độ.

Reader prompt, model/XAH, Supabase, giao diện, bộ 78 lá và các logic còn lại được giữ nguyên từ Tarot 2.7.46.
