# WebVer2.1 — Full web với prompt chuẩn

Đây là bản full kế tiếp của WebVer2.0. Toàn bộ giao diện, tính năng, phân quyền,
Supabase, thanh toán, Prompt Lab và cơ chế API dự phòng được giữ nguyên.

## Thay đổi trong bản này

- Cập nhật prompt `Thẳng thắn, lạnh lùng, sâu sắc` theo các bài so sánh đã duyệt.
- Giữ câu trả lời trực tiếp, đời thường, ngắn và có liên kết giữa các lá.
- Giảm suy diễn về suy nghĩ, động cơ và hành động của người khác.
- Giữ đúng chủ thể của câu hỏi; không biến góc nhìn của một người thành đánh giá
  khách quan về toàn bộ mối quan hệ.
- Hỗ trợ/Trở ngại không bị mặc định thành suy nghĩ riêng của một người.
- Phần `## Tóm lại` mặc định 4 câu, chỉ thêm câu thứ năm khi cần chặn hiểu sai.
- API dự phòng 1 dùng model `santiagosgrantp/gpt-6-astra` thay cho model cũ.

Prompt trong `lib/prompts.ts` được dùng chung cho API chính và API dự phòng.
Vì vậy khi hệ thống tự chuyển API, cách đọc bài không thay đổi.

## Kiểm tra trước khi deploy

```bash
npm install
npm run typecheck
npm run build
```

Xem hướng dẫn cấu hình tại `docs/HUONG-DAN-CAP-NHAT-SUPABASE-VERCEL.md`.
