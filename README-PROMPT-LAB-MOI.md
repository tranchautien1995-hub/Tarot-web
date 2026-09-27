# WebVer2.0 — Prompt Lab so sánh 4 bản đọc

## Chạy trên máy

1. Đặt file `.env.local` cạnh `package.json`.
2. Chạy `npm install` nếu chưa cài thư viện.
3. Chạy `npm run dev`.
4. Mở `http://localhost:3000/prompt-lab`.

Prompt Lab chỉ mở cho Admin hoặc chế độ local chưa cấu hình Supabase.

## Cách dùng

- Chọn dạng trải bài và phong cách đọc.
- Nhập cùng một câu hỏi và cùng một bộ lá.
- Prompt hiện tại được lấy trực tiếp từ `lib/prompts.ts`.
- Bản nháp ban đầu là bản sao của prompt hiện tại và được lưu trên trình duyệt.
- Bấm **Đọc đồng thời 4 ô** để gửi bốn request cùng lúc:
  1. Prompt hiện tại trên `santiagosgrantp/gpt-6-astra`.
  2. Prompt hiện tại trên `gpt-6-astra`.
  3. Prompt hiện tại trên `gpt-5.6-sol`.
  4. Prompt bản nháp trên `santiagosgrantp/gpt-6-astra`.
- Prompt Lab không trừ lượt trải bài.
- Bản nháp không tự ghi đè prompt chính.
- Nếu `gpt-6-astra` lỗi, Prompt Lab giữ thông báo lỗi ở ô số 2; ba request còn lại không bị hủy.
- Sau khi đủ bốn ô, bấm **Sao chép để gửi ChatGPT**. Nội dung sao chép đã gồm câu hỏi, bộ lá, phong cách, tên model, bốn kết quả và yêu cầu phân tích.

## API dùng trong Prompt Lab

Prompt Lab dùng API chính cho `gpt-6-astra` và `gpt-5.6-sol`; dùng API dự phòng 1
cho `santiagosgrantp/gpt-6-astra`. Thêm các biến sau vào `.env.local` hoặc Vercel
Environment Variables:

```env
XAH_API_KEY=DIEN_KEY_API_CHINH
XAH_BASE_URL=https://api.xah.io/v1
XAH_PREMIUM_MODEL=gpt-6-astra
XAH_FREE_MODEL=gpt-5.6-sol

XAH_FALLBACK_API_KEY=DIEN_KEY_MOI
XAH_FALLBACK_BASE_URL=https://api.xah.io/v1
XAH_FALLBACK_PREMIUM_MODEL=santiagosgrantp/gpt-6-astra
PROMPT_LAB_MODEL=santiagosgrantp/gpt-6-astra
```

`PROMPT_LAB_MODEL` có thể bỏ qua vì code đã mặc định dùng
`santiagosgrantp/gpt-6-astra`, nhưng nên khai báo để nhìn cấu hình rõ ràng.

Mỗi ô trong Prompt Lab khóa đúng provider và model của ô đó, vì vậy Astra chính
lỗi sẽ không làm hai ô Santiagos hoặc ô Sol đổi sang model khác. Trang đọc bài
chính vẫn giữ cơ chế API chính → API phụ như WebVer2.0; thay đổi này chỉ áp dụng
cho `/prompt-lab`.

Không đưa `.env.local` lên GitHub hoặc gửi kèm ZIP.
