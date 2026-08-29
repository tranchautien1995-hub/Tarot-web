# Tarot-2.7 — Low GPU / Idle Performance

Bản này tập trung giảm tải GPU/CPU khi web đứng yên hoặc khi người dùng chuyển sang YouTube/phần mềm khác.

## Thay đổi
- Giữ nguyên 75 ngôi sao nhưng chuyển thành nền tĩnh, không còn animation vô hạn.
- Bỏ `translate3d(0,0,0)` khỏi 78 lá trong quạt bài để không ép mỗi lá thành compositor layer.
- Hover vẫn nhô đúng 13px, nhưng chỉ lá đang hover mới transform.
- Quạt 78 lá chỉ render trong giai đoạn đang chọn bài (`phase === "fan"`). Khi đã đủ bài, quạt được gỡ khỏi DOM; nếu bỏ một lá để chọn lại, quạt tự xuất hiện trở lại.
- Khi tab/cửa sổ Tarot mất focus, các animation còn lại như shuffle, reveal và loading được pause; blur nền cũng được tắt tạm thời.

## Không thay đổi
- Thuật toán shuffle.
- 78 lá và khả năng chọn ngẫu nhiên.
- Logic bốc bài, không trùng lá.
- Logic xuôi/ngược.
- Reader prompt.
- `/api/read`, `/api/chat`, `lib/xah.ts`.
- Sponsor Gate Shopee.
