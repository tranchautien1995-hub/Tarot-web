# Tarot 2.7.24

Tiếp tục trực tiếp từ Tarot 2.7.23.

## Reader Thẳng thắn

- Đổi giọng phân tích sang tiếng Việt đời thường, như Reader đang nói trực tiếp với querent.
- Hạn chế các cấu trúc giống báo cáo như `đặt trọng tâm vào`, `lực cản đáng chú ý`, `mở ra cách xử lý`, `đặt vấn đề về` và `phần được hỗ trợ là`.
- Khi lá đủ căn cứ, mở thẳng bằng `Họ đang...`, `Mối quan hệ này đang...` hoặc `Bạn không nên...`, thay vì làm yếu câu bằng `có dấu hiệu đang`, `có vẻ như` hay `dường như`.
- Giữ ngôn ngữ có điều kiện cho tương lai, động cơ, suy nghĩ kín và những phần bài không thể xác nhận.
- Lời khuyên có thể đặt dưới dạng điều kiện `nếu bạn đang...` để cảnh báo một hành vi có thể xảy ra mà không buộc tội querent chắc chắn đang làm điều đó.
- Với câu hỏi về người cũ, Reader vẫn có thể chặn ngắn việc đánh đồng tình trạng của họ với chuyện còn yêu, quay lại hoặc liên hệ nếu đó là suy diễn dễ phát sinh.
- Cụm `khoảng trống dành cho bạn` chỉ được dùng như một giới hạn cụ thể: tình trạng của người cũ không tự chứng minh cơ hội cho querent. Không được biến nó thành kết luận tuyệt đối về vị trí của querent trong đời họ.

## Kỷ luật kiến thức giữ nguyên

- Không bóp méo nghĩa lá để tăng độ lạnh.
- Không thêm sự kiện, động cơ, hành vi, thời gian hoặc kết quả ngoài trải bài.
- Giữ đúng chiều xuôi/ngược và chức năng từng vị trí.
- Phân biệt điều được xác nhận, xu hướng có điều kiện và điều bài không biết.
- Giữ độ sâu của phân tích; giảm tính học thuật không đồng nghĩa rút ngắn hoặc làm bài đọc đơn giản.

## Phạm vi giữ nguyên

- Giữ nguyên GPT-6 Astra, XAH, streaming, Supabase, quạt bài, UI và logic khác.
- Giữ nguyên cách hiển thị **Justice** ngược.
- Giữ nguyên prompt Mặc định, Nhẹ nhàng và Tâm sự.

## Kiểm tra

- TypeScript typecheck và Next.js production build.
- Prompt sao chép trải bài đồng bộ với prompt Reader trực tiếp.
- Prompt Mặc định, Nhẹ nhàng và Tâm sự được đối chiếu với Tarot 2.7.23.
- Các file hiển thị lá bài được đối chiếu với Tarot 2.7.23.
- ZIP không chứa `.env.local`, `.env`, `node_modules`, `.next` hoặc cache build.
