# WebVer1.9 Full — Prompt Lab và API dự phòng

## Những gì có trong bản này

- Website WebVer1.9 đầy đủ.
- Prompt Lab tại `/prompt-lab`, chỉ dành cho Admin hoặc chế độ local.
- Prompt Reader đã chỉnh theo hướng ngắn gọn, dễ hiểu, ít học thuật.
- API chính giữ nguyên key/model cũ.
- API phụ dùng key mới và model `thanhnhan9023/gpt-6-astra`.
- Khi chuyển API, model phụ nhận **đúng cùng system prompt, user prompt, câu hỏi,
  bộ bài, vị trí lá và phong cách đọc** như model chính. Hệ thống chỉ đổi key,
  endpoint và model.
- Tự chuyển khi timeout, mất kết nối, HTTP 429 hoặc lỗi máy chủ.

## Chạy local

1. Tạo `.env.local` cạnh `package.json` từ `.env.example`.
2. Điền key thật, không đưa `.env.local` lên GitHub.
3. Chạy `npm install`.
4. Chạy `npm run dev`.
5. Mở `http://localhost:3000` hoặc `http://localhost:3000/prompt-lab`.

## Cấu hình API chính và phụ

```env
XAH_API_KEY=KEY_CU_DANG_DUNG
XAH_BASE_URL=https://api.xah.io/v1
XAH_FREE_MODEL=gpt-5.6-sol
XAH_PREMIUM_MODEL=gpt-6-astra
XAH_MODEL=gpt-6-astra

XAH_FALLBACK_API_KEY=KEY_MOI_TRONG_ANH
XAH_FALLBACK_BASE_URL=https://api.xah.io/v1
XAH_FALLBACK_FREE_MODEL=gpt-5.6-sol
XAH_FALLBACK_PREMIUM_MODEL=thanhnhan9023/gpt-6-astra

XAH_FIRST_BYTE_TIMEOUT_MS=25000
XAH_STREAM_TIMEOUT_MS=120000
XAH_NON_STREAM_TIMEOUT_MS=60000
XAH_FAILOVER_COOLDOWN_MS=60000
```

## Supabase

API dự phòng không cần tạo bảng hoặc chạy SQL. Supabase chỉ cần thay đổi nếu tài
khoản dùng Prompt Lab chưa có quyền Admin.

Mở **Supabase → SQL Editor**, thay email rồi chạy:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'EMAIL_ADMIN_CUA_BAN';
```

Sau đó đăng xuất và đăng nhập lại để token nhận quyền mới. Không đưa
`SUPABASE_SERVICE_ROLE_KEY` vào biến có tiền tố `NEXT_PUBLIC_`.

## Vercel

1. Vào **Project → Settings → Environment Variables**.
2. Giữ các biến Supabase và SePay hiện tại.
3. Thêm/cập nhật toàn bộ biến XAH ở phần cấu hình trên.
4. Chọn `Production`, `Preview` và `Development` nếu muốn dùng ở cả ba môi trường.
5. Vào **Deployments**, chọn bản mới nhất → **Redeploy**.

`.env.local` trên máy không tự chuyển lên Vercel; phải nhập lại biến trên Vercel.
