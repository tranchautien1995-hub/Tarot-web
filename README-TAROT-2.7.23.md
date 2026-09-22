# Tarot 2.7.23

Tiếp tục trực tiếp từ Tarot 2.7.22.

## Reader Thẳng thắn

- Cấm mở đầu bằng một từ `Có.`, `Không.` hoặc `Chưa đủ rõ.` đứng riêng.
- Câu mở đầu phải là một kết luận hoàn chỉnh, chứa cả câu trả lời và sắc thái chính, chẳng hạn “Họ đang không hạnh phúc…, dù…”, nếu trải bài thật sự hỗ trợ.
- Dứt khoát được thể hiện bằng việc người đọc hiểu ngay kết luận và lý do cốt lõi, không phải bằng câu cụt.
- Gỡ giới hạn cứng khoảng 22 từ và 2–4 câu mỗi đoạn. Cho phép câu dài hơn khi cần giải thích chính xác liên kết phức tạp.
- Độ dài bài đọc phải tương xứng số lá và đủ sâu; không rút gọn đến mức chỉ còn nghĩa cơ bản.
- Trước khi viết, Reader phải xác định mâu thuẫn hoặc thông điệp trung tâm rồi phát triển toàn bài quanh mạch đó.
- Không bắt buộc mỗi đoạn theo cùng một khuôn kết luận rồi tên lá; cho phép chuyển ý tự nhiên để tránh giọng checklist.
- Không bắt buộc nhắc mỗi lá đúng một lần. Một lá có thể tham gia nhiều liên kết, nhiều lá có thể đọc thành một cụm, nhưng không được bỏ sót vai trò quan trọng.
- `## Tóm lại` trở lại khoảng 5–7 câu thay vì đúng 6 câu máy móc.

## Kỷ luật kiến thức giữ nguyên

- Không bóp méo nghĩa lá để tăng độ lạnh.
- Không thêm sự kiện, động cơ, hành vi, thời gian hoặc kết quả ngoài trải bài.
- Giữ đúng chiều xuôi/ngược và chức năng từng vị trí.
- Phân biệt điều được xác nhận, xu hướng có điều kiện và điều bài không biết.

## Phạm vi giữ nguyên

- Giữ nguyên GPT-6 Astra, XAH, streaming, Supabase, quạt bài, UI và logic khác.
- Giữ nguyên cách hiển thị **Justice** ngược.
- Giữ nguyên prompt Mặc định, Nhẹ nhàng và Tâm sự.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Các giới hạn cứng 22 từ, 2–4 câu mỗi đoạn và đúng 6 câu phần kết đã được loại khỏi chế độ Thẳng thắn.
- Quy tắc mở đầu bằng câu hoàn chỉnh, tìm mâu thuẫn trung tâm và phân tích liên kết sâu đã được xác nhận trong prompt thực tế.
- Các rào chắn về kiến thức, vị trí, xuôi/ngược và chống suy diễn vẫn còn đầy đủ.
- Prompt Mặc định, Nhẹ nhàng và Tâm sự giữ nguyên từng ký tự.
- Cách hiển thị **Justice** ngược giữ nguyên từng ký tự.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
