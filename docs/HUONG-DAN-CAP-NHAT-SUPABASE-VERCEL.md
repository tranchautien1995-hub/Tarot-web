# Hướng dẫn cập nhật WebVer2.1 trên Supabase và Vercel

## 1. Supabase

Thay đổi prompt và model API không yêu cầu chạy SQL, không cần sửa bảng dữ liệu,
không cần thay RLS và không cần tạo lại tài khoản.

Nếu website tiếp tục dùng cùng project Supabase và cùng domain
`https://tarotbytien.io.vn`, hãy giữ nguyên toàn bộ cấu hình Supabase hiện tại.

Chỉ kiểm tra lại các mục sau nếu bạn đổi domain hoặc tạo project Vercel mới:

1. Mở Supabase Dashboard.
2. Chọn đúng project của website.
3. Vào `Authentication` → `URL Configuration`.
4. `Site URL` nên là `https://tarotbytien.io.vn`.
5. Trong `Redirect URLs`, giữ domain chính và thêm URL preview Vercel chỉ khi bạn
   muốn thử đăng nhập trực tiếp trên preview đó.

Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào biến có tiền tố `NEXT_PUBLIC_`.

## 2. Vercel — biến API cần sửa

1. Mở Vercel Dashboard.
2. Chọn project đang chạy `tarotbytien.io.vn`.
3. Vào `Settings` → `Environment Variables`.
4. Tìm biến `XAH_FALLBACK_PREMIUM_MODEL`.
5. Đổi giá trị thành:

```text
santiagosgrantp/gpt-6-astra
```

6. Nếu có biến `PROMPT_LAB_MODEL`, đổi giá trị thành:

```text
santiagosgrantp/gpt-6-astra
```

7. Nếu còn biến `XAH_FALLBACK_MODEL` chứa model cũ, hãy xóa biến đó hoặc đổi nó
   thành `santiagosgrantp/gpt-6-astra` để tránh nhầm khi kiểm tra.
8. Áp dụng thay đổi cho `Production`, `Preview` và `Development` nếu cả ba môi
   trường đều được dùng.

## 3. Các biến API nên có trên Vercel

Giữ nguyên API chính:

```text
XAH_API_KEY=<key API chính hiện tại>
XAH_BASE_URL=https://api.xah.io/v1
XAH_FREE_MODEL=gpt-5.6-sol
XAH_PREMIUM_MODEL=gpt-6-astra
XAH_MODEL=gpt-6-astra
```

Cập nhật API dự phòng 1:

```text
XAH_FALLBACK_API_KEY=<key có quyền dùng santiagosgrantp/gpt-6-astra>
XAH_FALLBACK_BASE_URL=https://api.xah.io/v1
XAH_FALLBACK_FREE_MODEL=gpt-5.6-sol
XAH_FALLBACK_PREMIUM_MODEL=santiagosgrantp/gpt-6-astra
PROMPT_LAB_MODEL=santiagosgrantp/gpt-6-astra
```

Cơ chế chuyển dự phòng:

```text
XAH_FIRST_BYTE_TIMEOUT_MS=25000
XAH_STREAM_TIMEOUT_MS=120000
XAH_NON_STREAM_TIMEOUT_MS=60000
XAH_FAILOVER_COOLDOWN_MS=60000
```

Không thêm tiền tố `NEXT_PUBLIC_` vào API key.

## 4. Các biến Supabase trên Vercel

Giữ nguyên giá trị đang hoạt động:

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL của Supabase>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable hoặc anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key, chỉ dùng phía server>
NEXT_PUBLIC_SITE_URL=https://tarotbytien.io.vn
```

Không dán lại key nếu Vercel đang có đúng giá trị. Việc đổi model không ảnh hưởng
đến các biến Supabase này.

## 5. Redeploy sau khi sửa biến

Biến môi trường chỉ có hiệu lực với deployment mới:

1. Mở tab `Deployments` trong project Vercel.
2. Chọn deployment mới nhất.
3. Bấm menu ba chấm → `Redeploy`.
4. Có thể bỏ chọn `Use existing Build Cache` nếu muốn Vercel dựng sạch hoàn toàn.
5. Đợi trạng thái `Ready`, sau đó thử một trải bài ở tài khoản Plus hoặc cao hơn.

## 6. Cấu hình local nếu cần thử trên máy

Trong `.env.local`, dùng:

```text
XAH_FALLBACK_PREMIUM_MODEL=santiagosgrantp/gpt-6-astra
PROMPT_LAB_MODEL=santiagosgrantp/gpt-6-astra
```

Sau khi sửa `.env.local`, dừng server bằng `Ctrl + C` rồi chạy lại:

```bash
npm run dev
```

Vercel không đọc `.env.local` trên máy tính. Khi public website, các biến phải
được khai báo trong `Settings` → `Environment Variables` của Vercel.
