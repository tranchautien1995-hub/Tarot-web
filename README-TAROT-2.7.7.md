# Tarot 2.7.7

Base: Tarot 2.7.6.

Thay đổi:
- Chỉ 5 lá ngoài cùng bên trái dùng vùng chọn/khung "lá vô hình".
- Mép phải không còn ghost frame.
- Khung ghost là outline toàn lá, nghiêng theo đúng góc quạt và không có mặt lưng.
- Lá đang hover chỉ dịch lên 24px; không đổi z-index, không phóng to, không tách thành một lá nổi riêng.
- Giữ nguyên pointer layer duy nhất để tránh lag và lệch vị trí chuột/lá.
