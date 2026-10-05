# Chẩn đoán lỗi giọng đọc

Ảnh báo “Không thể hoàn tất giọng đọc” do catch trong API che mọi nguyên nhân. Bản này sửa việc mất nguyên nhân, không khẳng định đã giải quyết lỗi production chưa quan sát được.

- Giữ model, voice, style, queue, streaming và quy tắc retry hiện tại.
- Phân loại lỗi HTTP Gemini 400/401/403/404/429/5xx, finish reason, audio format, audio rỗng, timeout và lỗi kết nối Redis khi đang tạo giọng.
- Client nhận thông báo an toàn và mã lỗi; chi tiết Gemini chỉ vào server log `[TTS] generation_failed`.
- Log có job id, model, style, HTTP status, mã lỗi và trạng thái đã có audio. Không log API key, toàn bộ payload hoặc bài đọc; redact key/text/style khỏi provider message.

Sửa: lib/tts/gemini.ts, app/api/tts/route.ts, scripts/test-tts.cjs.
Thêm: lib/tts/errors.ts và tài liệu này.

QA: typecheck/build và test TTS mock (streaming, 20 jobs/max 5, bốn preset, retry 429, HTTP errors, thông báo client, redaction log, không gọi trùng) PASS. Không có key/runtime log production để tái hiện lỗi thật.

Sau deploy: bấm Nghe và nếu lỗi, chụp thông báo mới. Vercel → project → Logs → lọc `/api/tts` → mở request GET cùng thời điểm → tìm `[TTS] generation_failed`. Gửi dòng log đó để xác định chính xác cách sửa. Không gửi giá trị API key.
