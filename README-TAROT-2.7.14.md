# Tarot 2.7.14

Tiếp tục trực tiếp từ Tarot 2.7.13.

## Thay đổi

- Chuyển model mặc định của XAH từ `stableai/gpt-5.6-sol` sang `gpt-6-astra`.
- Tiếp tục dùng router `POST https://api.xah.io/v1/chat/completions` vì phù hợp trực tiếp với cấu trúc hội thoại `system`, `user`, `assistant` hiện tại.
- Cập nhật thông báo lỗi sang GPT-6 Astra và hiển thị rõ endpoint khi XAH trả về 404.
- Cập nhật `.env.example` theo cấu hình GPT-6 Astra.
- Không thay đổi prompt đọc Tarot, ba phong cách đọc, Supabase hoặc chức năng cũ.

## Tạo `.env.local`

Tạo file `.env.local` ngay cạnh `package.json`, sau đó điền:

```env
NEXT_PUBLIC_SUPABASE_URL=GIU_NGUYEN_GIA_TRI_CUA_BAN
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=GIU_NGUYEN_GIA_TRI_CUA_BAN

XAH_API_KEY=API_KEY_XAH_CUA_BAN
XAH_BASE_URL=https://api.xah.io/v1
XAH_MODEL=gpt-6-astra
```

Sau khi sửa `.env.local`, phải dừng server đang chạy rồi chạy lại `npm run dev`. Nếu website đang được deploy, cần khai báo ba biến `XAH_API_KEY`, `XAH_BASE_URL`, `XAH_MODEL` trong phần Environment Variables của nền tảng deploy rồi redeploy; file `.env.local` trên máy không tự chuyển lên máy chủ.

Không thêm dấu nháy, không thêm `/chat/completions` vào `XAH_BASE_URL`, và không dùng biến `NEXT_PUBLIC_XAH_API_KEY` vì API key phải chỉ tồn tại phía server.

## Kiểm tra

- TypeScript typecheck: thành công.
- Next.js production build: thành công.
- Kiểm tra giả lập request XAH: cả cấu hình mặc định và cấu hình `.env.local` đều gửi model `gpt-6-astra` đến đúng endpoint `/chat/completions`.
- ZIP không chứa `.env.local`, `node_modules`, `.next` hoặc cache build.
