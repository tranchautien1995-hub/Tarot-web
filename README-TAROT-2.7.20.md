# Tarot 2.7.20

Tiếp tục trực tiếp từ Tarot 2.7.19.

## Sửa hiển thị tên lá

- Sửa lại đúng yêu cầu: chỉ bỏ dấu gạch giữa tên lá và chiều lá.
- `Justice — ngược` được hiển thị thành **Justice** ngược.
- `The Fool — xuôi` được hiển thị thành **The Fool** xuôi.
- Chữ “xuôi/ngược” vẫn xuất hiện trong bài đọc; chỉ các dấu `—`, `–` hoặc `-` bị loại bỏ.
- Tên lá tiếp tục được tự động in đậm.

## Phạm vi giữ nguyên

- Giữ nguyên toàn bộ Reader prompt của 2.7.19.
- Giữ nguyên GPT-6 Astra, XAH, streaming, Supabase, quạt bài, UI và logic khác.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Kiểm tra hiển thị xác nhận chỉ dấu `—`, `–`, `-` bị bỏ; chữ “xuôi/ngược” vẫn được giữ.
- Tên lá vẫn được chuẩn hóa đúng để giao diện tự động in đậm.
- `lib/prompts.ts` giống hoàn toàn bản 2.7.19.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
