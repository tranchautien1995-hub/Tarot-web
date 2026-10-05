# Reader UI và lịch sử Lenormand

- Điều khiển nghe sát bên phải; mobile xuống hàng khi cần và vẫn căn phải.
- Vùng gradient cyan nhỏ hơn, màu cyan tươi hơn; giữ nền tím của nút.
- Nâng cấp, Tiếp tục, Đọc bài dùng màu vàng.
- Menu Lenormand thêm lịch sử. Tự lưu bài đọc thành công trên trình duyệt theo tài khoản và giới hạn gói hiện có. Mở lại giữ câu hỏi, khung thời gian, lá bài, kiểu đọc và nội dung; không gọi lại Reader. Nghe chỉ tạo audio khi bấm nút. Có xóa từng mục.
- Không thay API Reader, prompt, routing, quota, auth, pricing, background hoặc assets.

File sửa: app/globals.css, components/LenormandReader.tsx, components/LenormandReaderMenu.tsx.
File thêm: lib/lenormand/history.ts, scripts/test-lenormand-history.cjs, tài liệu này.

QA: npm install, typecheck, production build; test history parser; test React Lenormand với localStorage (tải lại, mở lại, nghe, xóa, cả bốn kiểu đọc), giả lập iOS không có randomUUID và WebKit Audio, Pause/Resume/Stop, double click; regression TTS playback và AI router bằng mocks/local HTTP.
Không kiểm tra trên iPhone vật lý và không gọi Gemini live trong task này. Lịch sử lưu ở trình duyệt, không đồng bộ giữa thiết bị.
