# Tarot × Lenormand — tích hợp chính thức

Nguồn nền: WebVer2.3-HAR-AIRouting2-FULL(2).rar. Giao diện kết hợp từ Test5, dùng nguyên CSS chính thức.

Vào bằng lựa chọn Tarot × Lenormand trong intro hoặc tab thứ ba từ Tarot/Lenormand. Dùng AuthGate, quyền Lenormand và provider helper hiện có. Không dùng preview provider, không cấp quyền thử nghiệm cho tài khoản trên website. Không cần env mới.

Xáo/bốc/lật Tarot trước; các lá Tarot giữ trên bàn, tiếp tục xáo/bốc/lật Lenormand. Chỉ đủ cả hai hệ mới hiện Đọc bài. Các kiểu: 3+3, 5+5, 3+9 (3×3). API /api/combined/read gửi hai mảng riêng, giữ orientation Tarot, không thêm reversed Lenormand. Combined prompt đã có trong bản kết hợp; không sửa prompt riêng Tarot/Lenormand.

Giữ nguyên cấu hình CKEY/APIZ của bản chính. Không sửa quota, giá, schema, auth backend, bộ bài hay intro.

Chạy: npm install; npm run typecheck; npm run build.
