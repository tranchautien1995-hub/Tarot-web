# TTarot WebVer1 · mã nội bộ 2.7.50

## Thay đổi

- Plus: 29.000đ/tuần.
- Pro: 39.000đ/tuần.
- Pro Max: 59.000đ/tuần.
- Thêm nhận diện tài khoản Admin từ Supabase `app_metadata.role`.
- Admin hiển thị “Toàn quyền” và luôn được xem như có quyền cao hơn Pro Max.
- Thêm `docs/CREATE-ADMIN.sql` để nâng một tài khoản Supabase thành Admin an toàn, không hard-code mật khẩu trong source.
- Khi chạy local mà chưa cấu hình Supabase, chế độ xem trước tự nhận quyền `Admin · Toàn quyền` để thử nghiệm. Quyền này không áp dụng cho bản online.

## Tạo Admin

File `docs/CREATE-ADMIN.sql` đã được cấu hình cho `tranchautien1995@gmail.com`. Chạy file bằng Supabase SQL Editor, sau đó đăng xuất và đăng nhập lại để token nhận quyền mới.
