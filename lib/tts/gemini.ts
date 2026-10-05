import { resolveTtsVoicePreset } from "@/lib/tts/voice-presets";
export const TTS_MODEL = "gemini-3.8-flash-lite-tts";

export type AudioChunk = { data: string; rate: number };
const URL = "https://generativelanguage.googleapis.com/v1beta/models/" + TTS_MODEL + ":streamGenerateContent?alt=sse";

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new Error("Đã dừng.")); return; }
    const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(new Error("Đã dừng.")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** One generation per job; only pre-audio 429 retries can make another call. */
export async function* geminiAudio(text: string, signal: AbortSignal, readingStyle: unknown = "default"): AsyncGenerator<AudioChunk> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY trên server.");
  const preset = resolveTtsVoicePreset(readingStyle);
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text, speech_metadata: { style: preset.style } }] }],
    generationConfig: { responseModalities: ["AUDIO"], responseFormat: { audio: { mimeType: "AUDIO_L16", sampleRate: 24000 } }, speechConfig: { voiceConfig: { voice: preset.voice } } }
  });
  let response: Response | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    response = await fetch(URL, { method: "POST", headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" }, body, signal, cache: "no-store" });
    if (response.status !== 429) break;
    const retry = response.headers.get("Retry-After");
    const seconds = retry ? Number(retry) : NaN;
    const delay = Number.isFinite(seconds) ? seconds * 1000 : retry ? Date.parse(retry) - Date.now() : NaN;
    await response.body?.cancel();
    if (attempt === 3) throw new Error("Gemini đang giới hạn lượt gọi. Vui lòng thử lại sau.");
    await sleep(Math.min(30_000, Math.max(500, Number.isFinite(delay) ? delay : 1000 * 2 ** attempt + Math.random() * 250)), signal);
  }
  if (!response?.ok || !response.body) throw new Error(`Gemini không thể tạo giọng đọc. Hãy kiểm tra key, quyền model và voice ${preset.voice}.`);
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", hadAudio = false, remainder = Buffer.alloc(0);
  function parse(block: string): AudioChunk[] {
    const payload = block.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n").trim();
    if (!payload || payload === "[DONE]") return [];
    const value = JSON.parse(payload) as { error?: unknown; candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> };
    if (value.error) throw new Error("Gemini gặp lỗi khi tạo giọng đọc.");
    const chunks: AudioChunk[] = [];
    for (const candidate of value.candidates || []) {
      if (candidate.finishReason && candidate.finishReason !== "STOP") throw new Error("Gemini chưa đọc hết nội dung. Vui lòng thử lại.");
      for (const part of candidate.content?.parts || []) {
        if (!part.inlineData?.data) continue;
        const mime = part.inlineData.mimeType || "";
        if (!/^audio\/(?:l16|pcm)(?:;|$)/i.test(mime)) throw new Error("Gemini trả về định dạng audio không hỗ trợ.");
        const rate = Number(mime.match(/rate=(\d+)/i)?.[1] || 24000);
        if (rate !== 24000) throw new Error("Sample rate giọng đọc không đúng.");
        const bytes = Buffer.concat([remainder, Buffer.from(part.inlineData.data, "base64")]);
        const length = bytes.length - bytes.length % 2;
        remainder = bytes.subarray(length);
        for (let start = 0; start < length; start += 32768) chunks.push({ data: bytes.subarray(start, Math.min(start + 32768, length)).toString("base64"), rate });
      }
    }
    return chunks;
  }
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) { buffer += decoder.decode(); break; }
      buffer += decoder.decode(next.value, { stream: true });
      let boundary = buffer.search(/\r?\n\r?\n/);
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary), separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)![0];
        buffer = buffer.slice(boundary + separator.length);
        for (const chunk of parse(block)) { hadAudio = true; yield chunk; }
        boundary = buffer.search(/\r?\n\r?\n/);
      }
      if (buffer.length > 8_000_000) throw new Error("Audio frame quá lớn.");
    }
    if (buffer.trim()) for (const chunk of parse(buffer)) { hadAudio = true; yield chunk; }
    if (!hadAudio || remainder.length) throw new Error("Gemini không trả về audio hoàn chỉnh.");
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
