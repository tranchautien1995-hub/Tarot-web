-- Chạy trong Supabase Dashboard -> SQL Editor.
-- Đổi email và tên gói trước khi bấm Run.
-- Gói hợp lệ: free, plus, pro, pro_max.

do $$
declare
  target_email text := 'email-khach@example.com';
  target_plan text := 'plus';
begin
  if target_plan not in ('free', 'plus', 'pro', 'pro_max') then
    raise exception 'Gói không hợp lệ: %', target_plan;
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('subscription_plan', target_plan)
    - 'role'
    - 'is_admin'
  where lower(email) = lower(target_email);

  if not found then
    raise exception 'Không tìm thấy tài khoản: %', target_email;
  end if;
end $$;

-- Kiểm tra kết quả.
select
  email,
  raw_app_meta_data ->> 'subscription_plan' as subscription_plan,
  raw_app_meta_data ->> 'role' as role
from auth.users
where lower(email) = lower('email-khach@example.com');

-- Sau khi đổi gói, yêu cầu khách đăng xuất rồi đăng nhập lại để nhận JWT mới.
