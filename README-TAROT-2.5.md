# Tarot-2.5 — Shopee Sponsor Gate

Base: Tarot-2.4 Performance 60FPS.

## Thay đổi
- Thêm nút **Xem quảng cáo để mở khóa** trước lần đọc mới.
- Khi chưa mở liên kết Shopee, nút **Đọc bài** bị khóa.
- Người dùng chủ động bấm nút quảng cáo; Shopee mở ở tab mới.
- Sau cú bấm đó, **Đọc bài** được mở khóa cho trải bài hiện tại.
- `Đọc lại`, `Hỏi tiếp` và việc mở một bài đọc đã có không ép mở lại quảng cáo.
- Khi trải bài bị thay đổi/xóa/bốc lại, trạng thái quảng cáo được khóa lại.
- Có dòng thông báo rõ đây là liên kết Shopee tài trợ / có thể là liên kết tiếp thị liên kết.

## Cấu hình
Thêm vào `.env.local` khi chạy máy:

```env
NEXT_PUBLIC_SHOPEE_AFFILIATE_URL=https://<link-affiliate-shopee-cua-ban>
```

Trên Vercel, thêm Environment Variable cùng tên và Redeploy.

## Không thay đổi
- shuffle / random draw
- logic chọn bài
- logic xuôi/ngược
- `lib/prompts.ts`
- `app/api/read/route.ts`
- `app/api/chat/route.ts`
- `lib/xah.ts`

## Giới hạn kỹ thuật
Website chỉ xác nhận người dùng đã bấm mở liên kết Shopee; nó không thể xác minh họ đã xem trang Shopee trong bao lâu vì Shopee là domain khác.
