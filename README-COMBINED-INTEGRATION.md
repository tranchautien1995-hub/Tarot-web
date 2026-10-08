# Tarot × Lenormand trên bản MobileEntry-Gold

Source of truth: WebVer2.3-HAR-MobileEntry-Gold-FULL (1).zip.
Giữ nguyên intro mobile/logo/chạm màn hình, ẩn sao mobile, nút vàng, TTS, Lenormand history, API/provider, quyền tài khoản và các prompt riêng đang có.

Tab thứ ba Tarot × Lenormand mở từ Tarot, Lenormand hoặc intro desktop. Hai deck riêng, xáo/bốc/lật Tarot trước, Lenormand sau trên cùng bàn. Đủ cả hai hệ mới Đọc bài. 3+3, 5+5, 3+9 (Lenormand 3×3). Không cần env mới.

File sửa: app/page.tsx, app/globals.css, components/AuthGate.tsx, components/ReaderNavigation.tsx, components/LenormandReader.tsx, components/TarotEntryExperience.tsx.
File thêm: components/CombinedReader.tsx, components/CombinedReaderMenu.tsx, app/api/combined/read/route.ts, lib/combined/spreads.ts, lib/combined/prompts.ts, README-COMBINED-INTEGRATION.md.

Chạy npm install; npm run typecheck; npm run build. Thay toàn bộ nội dung source ở thư mục gốc dự án, giữ env đang dùng; không đặt ZIP giải nén thành một thư mục con trong source cũ.
