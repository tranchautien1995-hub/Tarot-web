# Tarot 2.7.6

Sửa riêng quạt bài từ 2.7.5:
- Bỏ khung "lá vô hình" ở giữa quạt để không còn hiệu ứng hai lá/viền chồng nhau.
- Lá giữa quạt hover bằng chính lá thật, nhô nhẹ 8px và chỉ tăng vài lớp z-index lân cận.
- Chỉ 14 lá mép trái và 14 lá mép phải dùng khung viền "lá vô hình".
- Vùng 22% bên trái/phải của quạt được ánh xạ trực tiếp vào các lá mép để những lá bị che vẫn chọn lần lượt được.
- Giữ nguyên single pointer layer để không quay lại lỗi lag/hitbox chồng nhau.
- Không thay đổi XAH, AI Reader, câu hỏi gợi ý hay logic trải bài.
