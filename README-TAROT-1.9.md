# Tarot-1.9 — Performance

Bản này lấy Tarot-1.8 làm nền và tập trung tối ưu hiệu năng frontend, không thay đổi prompt Reader, API hay logic Tarot.

Các thay đổi chính:

- Giữ đủ 78 lá trong quạt bài.
- Khi kéo bài, vị trí con trỏ/ghost được cập nhật bằng `requestAnimationFrame` và DOM style trực tiếp thay vì `setState` theo từng pixel; giảm mạnh re-render của toàn bộ quạt 78 lá.
- Chỉ cập nhật React state của ô hover khi thực sự chuyển sang một ô khác.
- Tính trước hình học/vị trí 78 lá bằng `useMemo` sau mỗi lần xáo, tránh tính lại trên các render không cần thiết.
- Tạm dừng animation của 150 ngôi sao trong lúc bộ bài đang xáo/bốc/lật; sao vẫn hiển thị và tự chạy lại khi hoàn tất.
- Không ép 78 lá và 150 sao giữ `will-change` liên tục, giảm số compositor layer/GPU memory không cần thiết.
- Các lá đã bốc trong quạt được `visibility:hidden` để trình duyệt không tiếp tục paint chúng.
- Ghost kéo bài di chuyển bằng CSS transform/GPU thay vì thay đổi layout của cả khu vực.
- Tạm bỏ blur của fan-shadow và backdrop blur của cụm nút mobile trong lúc tương tác nặng; giao diện tổng thể không đổi.
- Preload ảnh Rider–Waite của các lá vừa bốc trước lúc lật để giảm khựng khi reveal.
- `CardArtwork` hỗ trợ eager loading riêng cho các lá trong ô trải, trong khi thư viện bài vẫn lazy-load như trước.
- Next.js được đặt ở `15.5.21` (bản vá bảo mật tương thích Vercel); không thay đổi logic ứng dụng.

Các file Reader/backend được giữ nguyên:

- `lib/prompts.ts`
- `app/api/read/route.ts`
- `app/api/chat/route.ts`
- `lib/xah.ts`

Lưu ý kiểm tra:

- Kiểm tra cú pháp TypeScript riêng cho các component được sửa: OK.
- Không chạy được full `npm install`/Next.js build trong môi trường đóng gói vì npm install timeout; cần chạy `npm install && npm run build` trên máy hoặc Vercel.
