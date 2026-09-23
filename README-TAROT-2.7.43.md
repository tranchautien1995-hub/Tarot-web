# TTarot 2.7.43 — giọng đọc miễn phí

Phiên bản này phát triển trực tiếp từ Tarot 2.7.42 và giữ nguyên các chức năng đọc bài, prompt Reader, model/XAH, Supabase, đăng nhập, lịch sử, giao diện và thao tác lá bài.

## Thay đổi

- Thêm thanh **Nghe bài đọc** sau khi AI hoàn thành phần giải bài.
- Có các nút **Nghe bài**, **Tạm dừng**, **Tiếp tục** và **Dừng**.
- Có ba mức tốc độ: Chậm, Tự nhiên và Nhanh.
- Tự ưu tiên giọng tiếng Việt có sẵn trên thiết bị.
- Tự chia bài đọc dài thành nhiều đoạn để hạn chế trình duyệt ngắt giữa chừng.
- Khi đóng cửa sổ đọc bài, đọc lại hoặc thay đổi trải bài, âm thanh đang phát sẽ dừng.

## Chi phí và giới hạn

Tính năng dùng Web Speech API của trình duyệt nên không cần API key, không gọi dịch vụ AI tạo giọng và không phát sinh phí theo lượt đọc. Chất giọng phụ thuộc vào trình duyệt, hệ điều hành và các giọng tiếng Việt đã được cài trên thiết bị. Tính năng chỉ đọc trực tiếp, không tạo file âm thanh để tải xuống.
