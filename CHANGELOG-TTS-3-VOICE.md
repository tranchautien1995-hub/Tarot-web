# Gemini TTS — ba phong cách

Source of truth: `WebVer2.3-HAR-GeminiTTS-FULL(1).zip`. Preset lấy nguyên văn từ ZIP handoff.

## File đã sửa

- `app/page.tsx`: nhãn phong cách/voice và nút Nghe bài; gửi readingStyle hiện tại cho TTS.
- `components/useTtsPlayback.ts`: thêm readingStyle vào POST, giữ playback/stream/Pause/Resume/Stop.
- `app/api/tts/route.ts`: chỉ chấp nhận style id, truyền preset đã lưu vào Gemini; bỏ voice Fola cố định trong response xếp hàng.
- `lib/tts/gemini.ts`: resolve voice/style server-side; giữ model, streaming PCM và retry 429.
- `lib/tts/queue.ts`: lưu readingStyle trong local/Redis job, giữ nguyên khi POST trùng, hỗ trợ job cũ; thêm env TTS_MAX_CONCURRENCY và giữ alias cũ.
- `.env.example`: thêm TTS_MAX_CONCURRENCY=5, giữ toàn bộ env cũ.
- `scripts/test-tts.cjs`: kiểm tra mapping/style handoff, chống ghi đè từ client, preset qua queue, concurrency và env mới/cũ.
- `scripts/test-tts-playback.cjs`: kiểm tra client gửi readingStyle, không gửi voice/style prompt.
- `TTS-SETUP.md`: cấu hình và QA cho bản ba phong cách.

## File thêm

- `lib/tts/voice-presets.ts`: preset nguyên văn handoff, kèm chuẩn hóa style id không hợp lệ về default.
- `CHANGELOG-TTS-3-VOICE.md`: changelog này.

Không thêm dependency. Reader CKEY/APIZ, prompts, auth, quota, pricing, history/spread logic, landing, Prompt Lab, CSS và assets ngoài TTS giữ nguyên.

## QA

npm install, typecheck, production build; API bốn preset và style hash; 20 job local + 20 job Redis; retry 429, idempotency, Pause/Resume/Stop; 100 lượt router Reader: PASS. Gemini thật qua Next.js: cả bốn preset và bài sáu lá dài Gacrux PASS. Kiểm tra key/client bundle: PASS. Chi tiết và giới hạn QA trong TTS-SETUP.md.

FULL ZIP gồm toàn bộ source/assets; không có node_modules, .next hoặc key thật.
