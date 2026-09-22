# Tarot 2.7.21

Tiếp tục trực tiếp từ Tarot 2.7.20.

## Reader Thẳng thắn

- Loại bỏ xung đột cuối cùng trong prompt chung từng khuyến khích câu “trải bài nghiêng về có/không”.
- Với câu hỏi có/không, câu đầu chỉ được là `Có.`, `Không.` hoặc `Chưa đủ rõ.`; câu sau phải chốt trực tiếp vào đối tượng.
- Cấm trong toàn bài và `## Tóm lại`: “trải bài nghiêng về”, “các lá nghiêng về”, “theo trải bài này” và “câu trả lời nghiêng về việc”.
- Vẫn giữ kỷ luật Tarot: nếu bằng chứng thật sự mâu thuẫn thì phải dùng `Chưa đủ rõ.`, không ép thành có hoặc không.
- Buộc Reader đọc đúng chức năng vị trí. Lá Hỗ trợ phải giải thích cách nó hỗ trợ, kể cả khi ngược; không được biến nó thành Trở ngại thứ hai.
- Lá Trở ngại phải chỉ lực cản, Lời khuyên phải đưa ra việc có thể làm, và Xu hướng phải giữ tính điều kiện.
- Mỗi kết luận cốt lõi chỉ được nói đầy đủ một lần; không diễn đạt lại cùng ý chỉ để kéo dài.
- Câu cuối của `## Tóm lại` phải ngắn, đóng ở thực tế hiện tại và không dùng cụm “hình ảnh nổi bật”.

## Phạm vi giữ nguyên

- Giữ nguyên GPT-6 Astra, XAH, streaming, Supabase, quạt bài, UI và logic khác.
- Giữ nguyên cách hiển thị **Justice** ngược của 2.7.20.
- Giữ nguyên prompt Mặc định, Nhẹ nhàng và Tâm sự.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Quy tắc có/không mềm của prompt chung đã được loại riêng khỏi chế độ Thẳng thắn.
- Prompt Mặc định, Nhẹ nhàng và Tâm sự giữ nguyên từng ký tự.
- Cách hiển thị **Justice** ngược giữ nguyên từng ký tự từ 2.7.20.
- Nút “Sao chép trải bài” chứa đúng prompt Thẳng thắn mới.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
