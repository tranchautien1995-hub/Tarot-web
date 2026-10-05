# Gemini TTS — cấu hình và kiểm tra

Bản này dùng đúng `gemini-3.8-flash-lite-tts`. Preset voice và nguyên văn style lấy từ handoff `tts-voice-presets.ts`. Không đổi Reader prompt, CKEY/XAH, APIZ, routing, quota, pricing, auth helper, lịch sử hoặc logic trải bài.

| readingStyle | Nhãn trên UI | Voice | Style |
| --- | --- | --- | --- |
| `direct` | Thẳng thắn · Fola | Fola | Style B trong handoff |
| `gentle` | Nhẹ nhàng · Gacrux | Gacrux | Style C trong handoff |
| `companion` | Tâm sự · Gacrux | Gacrux | Giống hệt gentle, không thêm style |
| `default`, null, thiếu hoặc không hợp lệ | Mặc định · Fola | Fola | Style mặc định đã duyệt |

Client chỉ gửi text đã làm sạch, `readingStyle` và `jobId` của queue hiện có. Server chỉ nhận style id đã biết, lưu nó vào job rồi resolve preset khi tạo audio; không nhận voice hoặc style prompt tùy ý từ client. POST trùng ID không thay text/phong cách của job đã xếp hàng. Job Redis cũ thiếu trường readingStyle vẫn dùng default/Fola.

## Vercel

Thêm các biến sau trong Project → Settings → Environment Variables, rồi redeploy:

```dotenv
GEMINI_API_KEY=<Google API key có quyền dùng model TTS>
UPSTASH_REDIS_REST_URL=<REST URL của Redis database>
UPSTASH_REDIS_REST_TOKEN=<REST token có quyền đọc/ghi và EVAL>
TTS_MAX_CONCURRENCY=5
TTS_QUEUE_NAMESPACE=ttarot-production
```

Tất cả là biến server-side, không thêm `NEXT_PUBLIC_`. Giữ nguyên các env CKEY/XAH, APIZ, Supabase và thanh toán đang dùng. Mọi instance production cần cùng Redis, namespace và concurrency limit. Preview dùng namespace riêng, ví dụ `ttarot-preview`; nếu cần chung giới hạn giữa nhiều deployment thì dùng chung namespace và limit.

`TTS_MAX_CONCURRENCY` là tên env theo handoff mới. `TTS_MAX_CONCURRENT` từ source cũ vẫn được hỗ trợ khi chưa đặt tên mới; nếu đặt cả hai thì `TTS_MAX_CONCURRENCY` được ưu tiên. Không cần xóa hoặc đổi các env cũ.

Production/Vercel bắt buộc cấu hình Redis. Thiếu Redis sẽ hiện lỗi cấu hình TTS, không âm thầm chuyển sang in-memory rồi vượt giới hạn trên nhiều instance. Chạy `npm run dev` ở local có thể dùng queue in-memory khi chưa cấu hình Redis. `npm run start` là production nên vẫn cần Redis.

Redis/Upstash REST đã có trong SOURCE OF TRUTH được upload và được giữ nguyên kiến trúc. Task ba phong cách không thêm dependency hoặc dịch vụ mới. Queue in-memory chỉ giới hạn trong một Node instance, không tạo global limit trên Vercel.

Không có key thật trong FULL ZIP. Điền env trên Vercel hoặc `.env.local` ở máy của bạn.

## Cơ chế

- Chỉ khi bấm **Nghe bài**, client tạo một `jobId`, mở AudioContext trong thao tác click và POST `/api/tts` để xếp hàng. POST chưa gọi Gemini.
- Client GET cùng `jobId`. Redis Lua nhận slot nguyên tử, FIFO, tối đa 5 job đang tạo giọng. Lượt chưa tới sẽ trả trạng thái chờ, client kiểm tra lại sau 2 giây; không giữ function Vercel trong lúc xếp hàng.
- Khi nhận slot, server chỉ mở một luồng Gemini cho job. ID đã chạy không được tạo lại khi POST/GET trùng. Chỉ HTTP 429 trước audio mới retry tối đa 3 lần, theo Retry-After hoặc exponential backoff; không tự restart sau khi đã có audio.
- PCM mono 24 kHz được chuyển thành các frame NDJSON nhỏ và phát ngay khi có frame đầu. Không đợi WAV hoàn chỉnh. Client nhận audio độc lập với playback, chỉ schedule khoảng 8 giây phía trước; phần chờ phát lưu PCM với giới hạn 64 MiB. Pause không tạo request/model call mới, Resume tiếp tục audio đã nhận.
- **Dừng**, đóng bài đọc hoặc unmount sẽ dừng nguồn âm thanh, giải phóng audio queue, abort request và DELETE job. Nếu DELETE tới instance khác, lượt tạo giọng kiểm tra Redis mỗi 2 giây và abort khi thấy hủy. Không nhả slot trước khi đóng upstream.
- Deadline tạo giọng 240 giây; route Vercel `maxDuration=300`. Lease Redis 360 giây giúp phục hồi khi invocation chết; không cho lease hết hạn trước giới hạn function. Cần deployment hỗ trợ thời lượng route này.
- Lượt chờ không được client tiếp tục kiểm tra trong 60 giây sẽ được loại khỏi đầu queue để không chặn người khác. Redis job metadata có TTL 30 phút; nội dung bài đọc được xóa khi hoàn tất/lỗi/hủy. JobId không thay thế xác thực: route dùng auth helper hiện tại để kiểm tra owner.

## Kiểm tra lại

```bash
npm install
npm run typecheck
npm run build
node scripts/test-ai-router.cjs
node scripts/test-tts.cjs
node scripts/test-tts-playback.cjs
```

Test TTS mặc định dùng provider HTTP/SSE local, không dùng key thật. Để chạy nhánh distributed queue, trỏ vào **Redis database dành riêng cho test**:

```bash
TTS_TEST_REDIS_REST_URL=<test REST URL> TTS_TEST_REDIS_REST_TOKEN=<test REST token> node scripts/test-tts.cjs
```

Script tạo namespace UUID riêng, kiểm tra 20 request local và 20 request Redis, max=5, cả bốn preset, hash style đối chiếu handoff, client không ghi đè voice/style, preset giữ nguyên trong queue, env mới/cũ, idempotency, FIFO, lease giữa các queue instance, Stop, auth, lỗi cấu hình, 429, không retry sau audio và payload bài dài. Test playback không cần trình duyệt; nếu môi trường có `jsdom`, script kiểm tra thêm hook React thật, text/readingStyle gửi lên API, click nhanh, nhận audio sớm, Pause/Resume và cleanup.

## Kết quả đã kiểm tra trên bản giao

- `npm install`, typecheck và production build: PASS.
- `/api/tts` trong Next.js với Gemini thật và Redis thật: default, direct, gentle, companion đều PASS, nhận audio streaming. Test HTTP/SSE local đối chiếu đúng voice và toàn bộ style bằng SHA-256 của handoff, gồm cả gentle/companion có style giống hệt nhau. Độ trễ thực tế phụ thuộc Gemini và mạng.
- Bài Tarot 6 lá dài 5.457 ký tự với gentle/Gacrux: PASS, nhận 16.627.200 byte PCM (~346 giây audio). Audio đầu đến sau khoảng 6,8 giây, trước khi toàn bộ audio hoàn tất.
- 20 lượt đồng thời với các phong cách khác nhau ở local và 20 lượt Redis Lua thật: PASS, tối đa 5 lượt đang tạo giọng; mỗi job giữ đúng preset của nó. Test Redis chạy qua REST adapter local tương thích Upstash; chưa có credentials Upstash production để kiểm tra deployment Vercel của bạn.
- PCM scheduler và hook React thật: PASS cho nhận/phát sớm, hàng chờ audio dài, Pause/Resume, Stop, click nhanh và unmount. Đây là kiểm tra tự động với Web Audio fixture; chưa kiểm tra nghe bằng loa hoặc UI trong trình duyệt thật.
- 100 lượt Reader HTTP/SSE local với router CKEY/APIZ hiện tại: PASS. Các file Reader/router/prompt/auth/quota/pricing/asset ngoài TTS giữ nguyên checksum so với source bạn gửi.

Không thay model/voice qua env. Model cố định trong `lib/tts/gemini.ts`; voice/style resolve server-side từ `lib/tts/voice-presets.ts` theo handoff.
