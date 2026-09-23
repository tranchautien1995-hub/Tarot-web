-- BƯỚC 1: Tạo người dùng trong Supabase Dashboard > Authentication > Users.
-- BƯỚC 2: Thay email bên dưới bằng email tài khoản quản trị vừa tạo.
-- BƯỚC 3: Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor.

do $$
declare
  admin_email text := 'tranchautien1995@gmail.com';
  changed_rows integer;
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'admin',
    'subscription_plan', 'pro_max'
  )
  where lower(email) = lower(admin_email);

  get diagnostics changed_rows = row_count;
  if changed_rows = 0 then
    raise exception 'Không tìm thấy tài khoản có email %', admin_email;
  end if;
end $$;

-- Kiểm tra kết quả. Tài khoản phải đăng xuất rồi đăng nhập lại để token nhận quyền mới.
select
  id,
  email,
  raw_app_meta_data ->> 'role' as role,
  raw_app_meta_data ->> 'subscription_plan' as subscription_plan
from auth.users
where raw_app_meta_data ->> 'role' = 'admin';
