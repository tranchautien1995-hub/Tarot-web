# Tarot 2.7.22

Tiếp tục trực tiếp từ Tarot 2.7.21.

## Reader Thẳng thắn

- Bỏ yêu cầu máy móc buộc câu đầu chỉ được là `Có.`, `Không.` hoặc `Chưa đủ rõ.`.
- Reader phải xác định trước câu hỏi có thật sự là câu hỏi nhị phân hay không.
- Với câu hỏi có/không thật sự, có thể dùng `Có.`, `Không.`, `Chưa đủ rõ.` hoặc một câu hoàn chỉnh trực tiếp cùng ý; không bắt buộc dùng một từ đứng riêng.
- Với câu hỏi lời khuyên, tình trạng, cảm xúc, nguyên nhân hoặc lựa chọn, phải mở bằng kết luận tự nhiên phù hợp như “Bạn không nên…”, “Người ấy chưa…” nếu trải bài có căn cứ.
- Các ví dụ cấu trúc không được dùng như dữ kiện để thêm vào bài đọc.
- “Lạnh” được định nghĩa là ít cảm tính, không tâm sự, không xoa dịu và không thêm đồng cảm ngoài dữ liệu; không phải cộc lốc hoặc máy móc.
- Phần `## Tóm lại` cũng không được ép thành có/không nếu câu hỏi không phải dạng nhị phân.
- Tiếp tục cấm “trải bài nghiêng về”, “các lá nghiêng về”, “theo trải bài này” và “câu trả lời nghiêng về việc”.

## Phạm vi giữ nguyên

- Giữ nguyên toàn bộ kỷ luật kiến thức, vai trò vị trí, chống suy diễn và chống lặp của 2.7.21.
- Giữ nguyên GPT-6 Astra, XAH, streaming, Supabase, quạt bài, UI và logic khác.
- Giữ nguyên cách hiển thị **Justice** ngược.
- Giữ nguyên prompt Mặc định, Nhẹ nhàng và Tâm sự.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Quy tắc mở đầu một từ bắt buộc đã được loại bỏ hoàn toàn.
- Các quy tắc về đủ lá, đúng vị trí, không suy diễn và không xuyên tạc vẫn còn đầy đủ.
- Prompt Mặc định, Nhẹ nhàng và Tâm sự giữ nguyên từng ký tự.
- Cách hiển thị **Justice** ngược giữ nguyên từng ký tự.
- Nút “Sao chép trải bài” chứa đúng prompt mới.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
