# Sửa TTS điện thoại và kết quả Lenormand

Nền: `WebVer2.3-HAR-AIRouting2-FULL-Gemini-3Voice.zip` đã giao trước đó.

- Thêm `lib/tts/job-id.ts`: dùng randomUUID khi có; nếu trình duyệt không có phương thức này, tạo UUIDv4 bằng Web Crypto getRandomValues. Không dùng Math.random.
- Sửa `components/useTtsPlayback.ts`: dùng helper UUID tương thích trình duyệt cũ, giữ nguyên streaming, queue, voice/style và playback.
- Sửa `components/LenormandReader.tsx`: gắn khối Nghe/Pause/Resume/Stop vào kết quả đã đọc, cùng style/voice của Tarot; dừng audio khi đóng kết quả hoặc thay/xóa lá và khi đọc lại. Giữ nguyên payload Reader và API.
- Sửa `scripts/test-tts-playback.cjs`: test trường hợp không có randomUUID, 1.000 UUIDv4 khác nhau, WebKit AudioContext fallback và luồng phát thực tế của hook React.

QA: npm install, typecheck, production build PASS. API TTS bốn preset, queue local 20 job/max=5, 429/idempotency/Stop PASS. PCM và hook React với crypto.randomUUID không tồn tại PASS. Lenormand UI/real hook ở 390px với bốn phong cách, click nhanh, Pause/Resume, đóng kết quả hủy request PASS. 100 lượt kiểm tra router CKEY/APIZ local PASS. Không đổi provider, prompts, auth, quota, pricing, background hoặc assets.

Đây là QA tự động bằng fixture Web Audio/DOM, không phải kiểm tra trên thiết bị iPhone thật hoặc deployment Vercel production.

**Mục lịch sử Lenormand riêng chưa được sửa:** ZIP nền này không có mục lịch sử Lenormand riêng hoặc luồng Mở lại lịch sử Lenormand. Cần ZIP website đang deploy có mục đó để gắn TTS đúng component và giữ nguyên dữ liệu lịch sử. Không tự tạo hệ thống lịch sử mới hoặc đổi schema trong bản sửa này.

ZIP đầy đủ có source/assets, không có node_modules, .next hoặc secrets.
