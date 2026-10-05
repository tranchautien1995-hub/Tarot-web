"use client";

import { useEffect, useRef, useState } from "react";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";
import { PcmPlayer } from "@/lib/tts/player";
import { createTtsJobId } from "@/lib/tts/job-id";
export type SpeechStatus = "idle" | "waiting" | "generating" | "speaking" | "paused" | "error";
type Session = { id: string; abort: AbortController; player: PcmPlayer; headers?: Record<string, string>; paused: boolean; playing: boolean };

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new Error("Đã dừng.")); return; }
    const cancel = () => { clearTimeout(timer); signal.removeEventListener("abort", cancel); reject(new Error("Đã dừng.")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(); }, ms);
    signal.addEventListener("abort", cancel, { once: true });
  });
}
export function useTtsPlayback() {
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>("idle"), [speechError, setSpeechError] = useState("");
  const session = useRef<Session | null>(null);
  function dispose(current: Session) {
    current.abort.abort(); current.player.stop();
    const cancel = (headers: Record<string, string>) => fetch(`/api/tts?jobId=${current.id}`, { method: "DELETE", headers, keepalive: true }).catch(() => {});
    if (current.headers) void cancel(current.headers); else void getApiAuthHeaders().then(cancel).catch(() => {});
  }
  function stopReadingAloud() {
    const current = session.current; session.current = null;
    if (current) dispose(current);
    setSpeechStatus("idle"); setSpeechError("");
  }
  useEffect(() => () => { const current = session.current; session.current = null; if (current) dispose(current); }, []);

  async function startReadingAloud(text: string, readingStyle: string | null = "default") {
    if (!text.trim() || session.current) return; // Ref guards two rapid clicks before React rerenders.
    let current: Session | undefined;
    try {
      const abort = new AbortController(), id = createTtsJobId();
      const player = new PcmPlayer(playing => {
        if (session.current?.id !== id) return;
        session.current.playing = playing;
        if (!session.current.paused) setSpeechStatus(playing ? "speaking" : "generating");
      });
      current = { id, abort, player, paused: false, playing: false }; session.current = current;
      setSpeechError(""); setSpeechStatus("waiting");
      // Resume AudioContext inside the user's click, before network awaits (iOS).
      await player.unlock();
      current.headers = await getApiAuthHeaders();
      if (abort.signal.aborted) return;
      const response = await fetch("/api/tts", { method: "POST", headers: { ...current.headers, "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id, text, readingStyle: readingStyle || "default" }), signal: abort.signal });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Không thể tạo giọng đọc."); }
      let stream: Response;
      for (;;) {
        stream = await fetch(`/api/tts?jobId=${id}`, { headers: current.headers, signal: abort.signal, cache: "no-store" });
        if (stream.status !== 202) break;
        const data = await stream.json();
        if (!["waiting", "running"].includes(data.status)) throw new Error("Lượt nghe đã kết thúc hoặc bị dừng. Bấm Nghe để thử lại.");
        if (!current.paused) setSpeechStatus(data.status === "waiting" ? "waiting" : "generating");
        await wait(2000, abort.signal);
      }
      if (!stream.ok || !stream.body) { const data = await stream.json().catch(() => ({})); throw new Error(data.error || "Không thể phát giọng đọc."); }
      const reader = stream.body.getReader(), decoder = new TextDecoder(); let buffer = "", done = false;
      async function event(line: string) {
        if (!line.trim()) return;
        if (abort.signal.aborted || session.current !== current) throw new Error("Đã dừng.");
        const value = JSON.parse(line);
        if (value.type === "error") throw new Error(value.error || "Không thể phát giọng đọc.");
        if (value.type === "status" && !current!.paused && !current!.playing) setSpeechStatus("generating");
        if (value.type === "audio") await player.append(value.data, value.rate, abort.signal);
        if (value.type === "done") done = true;
      }
      try {
        for (;;) {
          const chunk = await reader.read(); if (chunk.done) { buffer += decoder.decode(); break; }
          buffer += decoder.decode(chunk.value, { stream: true });
          let boundary = buffer.indexOf("\n");
          while (boundary >= 0) { const line = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 1); await event(line); boundary = buffer.indexOf("\n"); }
          if (buffer.length > 2_000_000) throw new Error("Audio frame quá lớn.");
        }
        if (buffer.trim()) await event(buffer);
        if (!done) throw new Error("Giọng đọc bị ngắt. Vui lòng thử lại.");
        await player.drain(abort.signal);
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      if (session.current === current) { session.current = null; player.stop(); setSpeechStatus("idle"); }
    } catch (error) {
      if (current && session.current !== current) return;
      if (current) { session.current = null; dispose(current); }
      setSpeechError(error instanceof Error ? error.message : "Không thể tạo giọng đọc."); setSpeechStatus("error");
    }
  }
  async function toggleSpeechPause() {
    const current = session.current; if (!current) return;
    try {
      if (current.paused) { current.paused = false; await current.player.resume(); }
      else { current.paused = true; await current.player.pause(); }
      if (session.current === current) setSpeechStatus(current.paused ? "paused" : current.playing ? "speaking" : "generating");
    } catch { if (session.current === current) { stopReadingAloud(); setSpeechStatus("error"); setSpeechError("Không thể tạm dừng/tiếp tục giọng đọc."); } }
  }
  return { speechStatus, speechError, startReadingAloud, stopReadingAloud, toggleSpeechPause };
}
