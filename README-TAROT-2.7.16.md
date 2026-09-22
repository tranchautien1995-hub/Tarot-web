# Tarot 2.7.16

Tiếp tục trực tiếp từ Tarot 2.7.15.

## Thay đổi

- Phần “Đọc trải bài” nay hiển thị nội dung theo thời gian thực: GPT-6 Astra tạo đến đâu, chữ xuất hiện đến đó.
- API `/api/read` yêu cầu XAH trả luồng bằng `stream: true`, giải mã chuẩn SSE của Chat Completions và chuyển từng phần văn bản về trình duyệt.
- Trong lúc chờ đoạn đầu tiên, giao diện vẫn hiện trạng thái “Đang kết nối các lá”. Ngay khi nhận được chữ đầu tiên, bài đọc xuất hiện cùng con trỏ nhấp nháy.
- Phần “Hỏi tiếp”, sao chép và đọc lại chỉ mở sau khi bài đọc đã hoàn tất để tránh dùng nội dung còn dang dở.
- Có xử lý dự phòng nếu XAH trả JSON hoàn chỉnh thay vì SSE, nên chức năng đọc bài vẫn hoạt động dù provider không stream trong một tình huống cụ thể.

## Phạm vi giữ nguyên

- Không thay đổi prompt, bốn cách đọc, GPT-6 Astra, XAH `/chat/completions`, Supabase hoặc logic trải bài.
- `.env.local` tiếp tục không được đóng vào ZIP.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Kiểm tra streaming giả lập xác nhận các SSE chunk bị chia giữa nội dung JSON vẫn được ghép đúng thứ tự và hiển thị đầy đủ.
- Kiểm tra dự phòng JSON hoàn chỉnh: thành công.
- Request XAH được xác nhận dùng `gpt-6-astra` cùng `stream: true`.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
