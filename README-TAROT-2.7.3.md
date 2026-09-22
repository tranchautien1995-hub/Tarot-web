# Tarot-2.7.3

Base chính thức: **Tarot-2.7.2**.

## Thay đổi

1. Câu hỏi gợi ý
- Xóa câu placeholder cũ và xóa toàn bộ chip gợi ý dưới ô câu hỏi.
- Thêm 50 câu hỏi gợi ý dạng placeholder mờ ngay trong textarea.
- Mỗi lần refresh trang sẽ chọn một câu khác với câu của lần tải trước (dùng sessionStorage khi khả dụng).
- Khi từ phần Trải bài bấm “Quay lại”, placeholder cũng đổi sang câu khác.

2. Dễ bốc các lá ở mép quạt
- Giữ nguyên hình học/vị trí của 78 lá.
- Thêm 12 vùng hitbox proxy trong suốt ở mỗi mép trái/phải trên desktop.
- Khi rê vào vùng proxy, đúng lá tương ứng hiện viền mảnh để người dùng nhận biết và có thể kéo/bốc từ vùng đó.

3. Hover lá rõ hơn
- Lá đang hover/được proxy nhắm tới nhô lên 16px.
- Tăng z-index tạm thời và hiện viền sáng để biết chính xác lá nào đang được chọn.
- Hitbox thật đứng yên nên tránh rung/flicker ở vùng các lá chồng nhau.

## Giữ nguyên
- XAH / GPT-5.6 Sol.
- Supabase.
- Random shuffle, xuôi/ngược, Reader, lịch sử, Rider–Waite và toàn bộ logic của 2.7.2.
