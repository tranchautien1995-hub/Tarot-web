import { verifyApiUser } from "@/lib/supabase/server-auth";
import { TtsQueue, validJobId } from "@/lib/tts/queue";
import { geminiAudio, TTS_MODEL } from "@/lib/tts/gemini";
import { normalizeTtsReadingStyle } from "@/lib/tts/voice-presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const NO_CACHE = { "Cache-Control": "no-store, no-transform" };

async function ownerOf(request: Request): Promise<string | Response> {
  const auth = await verifyApiUser(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status, headers: NO_CACHE });
  return auth.localMode ? "local-preview" : auth.user!.id;
}
function failure(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : "Không thể tạo giọng đọc." }, { status: 503, headers: NO_CACHE });
}

/** Idempotent enqueue. Never calls Gemini until a client requests this job. */
export async function POST(request: Request) {
  const owner = await ownerOf(request); if (owner instanceof Response) return owner;
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!validJobId(body?.jobId) || !text || text.length > 16000) return Response.json({ error: "Nội dung cần từ 1–16000 ký tự và jobId hợp lệ." }, { status: 400, headers: NO_CACHE });
    if (!process.env.GEMINI_API_KEY?.trim()) throw new Error("Chưa cấu hình GEMINI_API_KEY trên server.");
    const queue = new TtsQueue();
    // Only accept the known style id. Client voice/style-prompt fields are ignored.
    const status = await queue.enqueue(body.jobId, owner, text, normalizeTtsReadingStyle(body.readingStyle));
    return Response.json({ jobId: body.jobId, status, model: TTS_MODEL }, { status: 202, headers: NO_CACHE });
  } catch (error) { return failure(error); }
}

/** A waiting job returns quickly. Polling never occupies a waiting Vercel function. */
export async function GET(request: Request) {
  const owner = await ownerOf(request); if (owner instanceof Response) return owner;
  const id = new URL(request.url).searchParams.get("jobId");
  if (!validJobId(id)) return Response.json({ error: "jobId không hợp lệ." }, { status: 400, headers: NO_CACHE });
  let queue: TtsQueue;
  try {
    queue = new TtsQueue();
    const claim = await queue.claim(id, owner);
    if (claim.status !== "claimed") return Response.json({ status: claim.status }, { status: 202, headers: { ...NO_CACHE, "Retry-After": "2" } });
    const abort = new AbortController(), untrack = queue.track(id, abort), iterator = geminiAudio(claim.text!, abort.signal, claim.readingStyle);
    const timer = setTimeout(() => { abort.abort(); void cleanup("error"); }, 240_000);
    let polling = false;
    const monitor = setInterval(async () => {
      if (polling) return; polling = true;
      try { if (await queue.isCancelled(id, owner)) { abort.abort(); void cleanup("cancelled"); } }
      catch { abort.abort(); void cleanup("error"); }
      finally { polling = false; }
    }, 2000);
    const clientAbort = () => { abort.abort(); void cleanup("cancelled"); };
    request.signal.addEventListener("abort", clientAbort, { once: true });
    let cleaned: Promise<void> | undefined;
    function cleanup(status: "done" | "error" | "cancelled") {
      if (!cleaned) cleaned = (async () => {
        clearTimeout(timer); clearInterval(monitor); untrack();
        request.signal.removeEventListener("abort", clientAbort);
        // Close upstream before freeing a slot: never admit a sixth live request.
        abort.abort();
        await iterator.return(undefined).catch(() => {});
        await queue.finish(id!, owner as string, status).catch(() => { /* Fixed lease bounds recovery when Redis is unavailable. */ });
      })();
      return cleaned;
    }
    if (request.signal.aborted) clientAbort();
    const encoder = new TextEncoder(); let initial = true;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          if (abort.signal.aborted) throw new Error("Đã dừng hoặc hết thời gian tạo giọng.");
          if (initial) { initial = false; controller.enqueue(encoder.encode(JSON.stringify({ type: "status", status: "generating" }) + "\n")); return; }
          const chunk = await iterator.next();
          if (abort.signal.aborted) throw new Error("Đã dừng hoặc hết thời gian tạo giọng.");
          if (chunk.done) { await cleanup("done"); controller.enqueue(encoder.encode('{"type":"done"}\n')); controller.close(); }
          else controller.enqueue(encoder.encode(JSON.stringify({ type: "audio", ...chunk.value }) + "\n"));
        } catch {
          await cleanup(request.signal.aborted ? "cancelled" : "error");
          try { controller.enqueue(encoder.encode(JSON.stringify({ type: "error", error: "Không thể hoàn tất giọng đọc. Vui lòng thử lại." }) + "\n")); controller.close(); } catch { /* Client already cancelled. */ }
        }
      },
      async cancel() { await cleanup("cancelled"); }
    });
    return new Response(stream, { headers: { ...NO_CACHE, "Content-Type": "application/x-ndjson; charset=utf-8", "X-Accel-Buffering": "no" } });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  const owner = await ownerOf(request); if (owner instanceof Response) return owner;
  const id = new URL(request.url).searchParams.get("jobId");
  if (!validJobId(id)) return Response.json({ error: "jobId không hợp lệ." }, { status: 400, headers: NO_CACHE });
  try { await new TtsQueue().cancel(id, owner); return Response.json({ status: "cancelled" }, { headers: NO_CACHE }); }
  catch (error) { return failure(error); }
}
