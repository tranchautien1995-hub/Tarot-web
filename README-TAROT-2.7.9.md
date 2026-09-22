# Tarot 2.7.9

Tiếp tục từ 2.7.8, phát triển từ ZIP Tarot-2.7.7(1).zip do người dùng cung cấp.

- Khôi phục cắt nội dung quạt bài trong khung: các mặt lưng không tràn ra hai bên.
- Khung ghost trong suốt được vẽ riêng ngoài khung, chỉ cho 5 lá ngoài cùng bên trái khi hover, khớp góc xoay và độ nhô của lá thật.
- Vùng nhận chuột trong suốt, đứng yên và trùng chính xác hình học từng lá; trình duyệt chọn lá trên cùng tại con trỏ.
- Bỏ phép quy đổi theo tọa độ X và vùng trái 14% gây lệch.
- Giữ mức nhô 36px, kích thước và z-index lá thật.
- Ghost tự ẩn khi cuộn hoặc đổi kích thước và hỗ trợ light/dark.
- Giữ nguyên XAH/model, Supabase và những phần khác.
- ZIP không chứa .env.local, node_modules hay dữ liệu build.

Kiểm tra: TypeScript và production build thành công. Trước khi thư mục tạm được làm mới, bản này đã qua kiểm tra Chromium tại 48 điểm trên quạt bài, kéo lá vào ô thành công và ghost trong suốt được vẽ ngoài khung.
