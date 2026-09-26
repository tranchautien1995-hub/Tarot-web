-- Thay email bên dưới bằng email tài khoản quản trị của bạn rồi chạy trong
-- Supabase → SQL Editor. Sau đó đăng xuất và đăng nhập lại website.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'EMAIL_ADMIN_CUA_BAN';

-- Kiểm tra kết quả (không hiển thị mật khẩu):
select id, email, raw_app_meta_data
from auth.users
where email = 'EMAIL_ADMIN_CUA_BAN';
