# Tarot 2.7.19

Tiếp tục trực tiếp từ Tarot 2.7.18.

## Reader Thẳng thắn

- Độ lạnh chỉ được thể hiện bằng cách nói; không được làm sai, làm nặng hoặc bóp méo nghĩa lá bài.
- Reader phải kiểm tra thầm toàn bộ lá và vị trí, không bỏ sót lá nào và không thêm sự kiện ngoài trải bài.
- Mỗi đoạn thân bài phải mở bằng kết luận đời thường; không được mở bằng tên lá hoặc tên vị trí. Tên lá chỉ xuất hiện sau đó để làm bằng chứng.
- Ưu tiên câu ngắn, mỗi câu một ý và đoạn 2–4 câu; hạn chế câu dài quá khoảng 22 từ.
- Tách rõ điều lá xác nhận, xu hướng có điều kiện và điều bài không biết.
- Không tự dựng động cơ, suy nghĩ, quan hệ, hành vi, thời gian hoặc kết quả để tăng cảm giác mạnh.
- Chỉ dùng đoạn “Nói thẳng:” hoặc đưa lời khuyên khi các lá, vị trí hoặc câu hỏi thực sự hỗ trợ.
- Mẫu nhịp văn được đổi thành mẫu trung tính để không vô tình đưa nội dung “quay lại”, “chờ đợi” vào mọi câu hỏi.

## Hiển thị tên lá

- Khi AI viết `Justice — ngược`, `The Fool — ngược` hoặc dạng tương tự, giao diện chỉ hiển thị **Justice**, **The Fool** trong câu văn.
- Dấu gạch cùng chữ “xuôi/ngược” sau tên lá được bỏ khỏi phần bài đọc; tên lá vẫn tự động in đậm.
- Thông tin xuôi/ngược vẫn được giữ đầy đủ trong dữ liệu trải bài và prompt gửi cho AI, nên độ chính xác luận giải không thay đổi.

## Phạm vi giữ nguyên

- Giữ nguyên GPT-6 Astra, XAH `/chat/completions`, streaming, Supabase, quạt bài và các UI khác.
- Giữ nguyên cách đọc Mặc định, Nhẹ nhàng và Tâm sự.

## Kiểm tra

- TypeScript typecheck và Next.js production build: thành công.
- Kiểm tra hợp đồng prompt xác nhận Mặc định, Nhẹ nhàng và Tâm sự giữ nguyên từng ký tự.
- Dữ liệu gửi cho AI vẫn giữ đầy đủ tên lá, vị trí và chiều xuôi/ngược.
- Kiểm tra hiển thị xác nhận các dạng `—`, `–`, `-`, chữ hoa/thường và tên lá đã có Markdown đều được xử lý đúng.
- Tên lá vẫn được giữ nguyên để `ReadingText` tự động in đậm.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
