# WebVer1.9 — Prompt Lab mới

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
- Bấm **Chạy prompt hiện tại**, **Chạy bản nháp** hoặc **So sánh cả hai**.
- Prompt Lab không trừ lượt trải bài.
- Bản nháp không tự ghi đè prompt chính.

## API chính và API phụ

WebVer1.9 giữ nguyên key/model chính. Khi API chính lỗi, hệ thống mới gọi key và
model phụ:

```env
XAH_FALLBACK_API_KEY=DIEN_KEY_MOI
XAH_FALLBACK_BASE_URL=https://api.xah.io/v1
XAH_FALLBACK_PREMIUM_MODEL=thanhnhan9023/gpt-6-astra
```

Không đưa `.env.local` lên GitHub hoặc gửi kèm ZIP.
