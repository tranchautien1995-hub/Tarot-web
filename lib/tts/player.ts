/** Receive PCM independently of playback; schedule only ~8 seconds ahead.
 * Pausing does not keep a serverless generation open for the entire reading.
 */
export class PcmPlayer {
  readonly context: AudioContext;
  private endTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private paused = false;
  private closed = false;
  private playing = false;
  private pending: Uint8Array[] = [];
  private queuedBytes = 0;
  private readonly scheduler: ReturnType<typeof setInterval>;
  constructor(private onPlayback: (playing: boolean) => void) {
    const Constructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) throw new Error("Trình duyệt chưa hỗ trợ phát giọng đọc streaming.");
    this.context = new Constructor();
    this.scheduler = setInterval(() => this.schedule(), 100);
  }
  async unlock() { await this.context.resume(); }
  async pause() { this.paused = true; await this.context.suspend(); }
  async resume() { this.paused = false; await this.context.resume(); this.schedule(); }
  private delay(signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted || this.closed) { reject(new Error("Đã dừng.")); return; }
      const aborted = () => { clearTimeout(timer); signal.removeEventListener("abort", aborted); reject(new Error("Đã dừng.")); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", aborted); resolve(); }, 100);
      signal.addEventListener("abort", aborted, { once: true });
    });
  }
  async append(data: string, rate: number, signal: AbortSignal) {
    if (rate !== 24000) throw new Error("Sample rate không hỗ trợ.");
    if (signal.aborted || this.closed) throw new Error("Đã dừng.");
    const bytes = Uint8Array.from(atob(data), value => value.charCodeAt(0));
    if (!bytes.length || bytes.length % 2) throw new Error("PCM không hợp lệ.");
    if (this.queuedBytes + bytes.length > 64 * 1024 * 1024) throw new Error("Giọng đọc vượt giới hạn bộ nhớ. Vui lòng dừng và thử bài ngắn hơn.");
    this.pending.push(bytes); this.queuedBytes += bytes.length; this.schedule();
  }
  private schedule() {
    if (this.closed || this.paused) return;
    while (this.pending.length && this.endTime - this.context.currentTime <= 8) {
      const bytes = this.pending.shift()!; this.queuedBytes -= bytes.length;
      this.scheduleChunk(bytes);
    }
  }
  private scheduleChunk(bytes: Uint8Array) {
    const audio = this.context.createBuffer(1, bytes.length / 2, 24000), samples = audio.getChannelData(0), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
    const source = this.context.createBufferSource(); source.buffer = audio; source.connect(this.context.destination);
    const start = Math.max(this.endTime, this.context.currentTime + .05);
    this.endTime = start + audio.duration; this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source); source.disconnect();
      this.schedule();
      if (!this.sources.size && !this.closed) { this.playing = false; this.onPlayback(false); }
    };
    source.start(start);
    if (!this.playing) { this.playing = true; this.onPlayback(true); }
  }
  async drain(signal: AbortSignal) { while ((this.sources.size || this.pending.length) && !this.closed) await this.delay(signal); }
  stop() {
    if (this.closed) return; this.closed = true; clearInterval(this.scheduler);
    this.pending = []; this.queuedBytes = 0;
    for (const source of this.sources) { source.onended = null; try { source.stop(); source.disconnect(); } catch { /* Already ended. */ } }
    this.sources.clear(); void this.context.close().catch(() => {});
  }
}
