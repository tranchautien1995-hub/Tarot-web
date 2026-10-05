import { randomUUID } from "node:crypto";
import { normalizeTtsReadingStyle, type TtsReadingStyle } from "@/lib/tts/voice-presets";

export type JobStatus = "waiting" | "running" | "done" | "error" | "cancelled";
export type Claim = { status: JobStatus | "claimed"; text?: string; readingStyle?: TtsReadingStyle };
const TTL_SECONDS = 1800;
// Longer than the 240s generation deadline and Vercel's configured 300s run.
// No lease renewal that can accidentally expire during an active invocation.
const LEASE_MS = 360_000;
const WAIT_LEASE_MS = 60_000;

type LocalJob = { owner: string; text: string; readingStyle?: TtsReadingStyle; status: JobStatus; expires: number; deadline?: number; waitDeadline?: number; sequence: number };
const localJobs = new Map<string, LocalJob>();
let sequence = 0;
const localControllers = new Map<string, AbortController>();

export const validJobId = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
export const newJobId = randomUUID;

export const ENQUEUE_LUA = `-- tts-enqueue
local old = redis.call('HGET', KEYS[3], 'owner')
if old then
 if old ~= ARGV[2] then return 'forbidden' end
 return redis.call('HGET', KEYS[3], 'status')
end
local seq = redis.call('INCR', KEYS[4])
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
redis.call('HSET', KEYS[3], 'owner', ARGV[2], 'text', ARGV[3], 'readingStyle', ARGV[6], 'status', 'waiting', 'waitDeadline', now + tonumber(ARGV[5]))
redis.call('EXPIRE', KEYS[3], ARGV[4])
redis.call('ZADD', KEYS[1], seq, ARGV[1])
redis.call('EXPIRE', KEYS[1], ARGV[4])
redis.call('EXPIRE', KEYS[4], ARGV[4])
return 'waiting'`;

export const CLAIM_LUA = `-- tts-claim
if redis.call('HGET', KEYS[3], 'owner') ~= ARGV[2] then return {'forbidden'} end
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now)
local status = redis.call('HGET', KEYS[3], 'status')
if status == 'running' and tonumber(redis.call('HGET', KEYS[3], 'deadline') or '0') <= now then
 redis.call('HSET', KEYS[3], 'status', 'error')
 redis.call('HDEL', KEYS[3], 'text')
 status = 'error'
end
if status ~= 'waiting' then return {status} end
redis.call('HSET', KEYS[3], 'waitDeadline', now + tonumber(ARGV[7]))
-- Remove dead/cancelled waiters. A waiting request does not occupy a function.
for i=1,100 do
 local head = redis.call('ZRANGE', KEYS[1], 0, 0)[1]
 if not head then return {'waiting'} end
 local headKey = ARGV[5] .. head
 if redis.call('HGET', headKey, 'status') == 'waiting' and tonumber(redis.call('HGET', headKey, 'waitDeadline') or '0') <= now then
  redis.call('HSET', headKey, 'status', 'cancelled')
  redis.call('HDEL', headKey, 'text')
 end
 if redis.call('HGET', headKey, 'status') ~= 'waiting' then
  redis.call('ZREM', KEYS[1], head)
 else
  if head ~= ARGV[1] or redis.call('ZCARD', KEYS[2]) >= tonumber(ARGV[3]) then return {'waiting'} end
  redis.call('ZREM', KEYS[1], ARGV[1])
  redis.call('ZADD', KEYS[2], now + tonumber(ARGV[4]), ARGV[1])
  redis.call('EXPIRE', KEYS[2], ARGV[6])
  redis.call('HSET', KEYS[3], 'status', 'running', 'deadline', now + tonumber(ARGV[4]))
  return {'claimed', redis.call('HGET', KEYS[3], 'text'), redis.call('HGET', KEYS[3], 'readingStyle') or 'default'}
 end
end
return {'waiting'}`;

export const FINISH_LUA = `-- tts-finish
if redis.call('HGET', KEYS[3], 'owner') ~= ARGV[2] then return 'forbidden' end
redis.call('ZREM', KEYS[1], ARGV[1])
redis.call('ZREM', KEYS[2], ARGV[1])
if redis.call('HGET', KEYS[3], 'status') ~= 'cancelled' then
 redis.call('HSET', KEYS[3], 'status', ARGV[3])
end
redis.call('HDEL', KEYS[3], 'text')
return 'ok'`;

export const CANCEL_LUA = `-- tts-cancel
local old = redis.call('HGET', KEYS[3], 'owner')
if old and old ~= ARGV[2] then return 'forbidden' end
redis.call('HSET', KEYS[3], 'owner', ARGV[2], 'status', 'cancelled')
redis.call('HDEL', KEYS[3], 'text')
redis.call('EXPIRE', KEYS[3], ARGV[3])
redis.call('ZREM', KEYS[1], ARGV[1])
-- Keep a RUNNING lease until its invocation confirms cancellation. Releasing
-- immediately here could admit a sixth Gemini job on a different instance.
return 'ok'`;

export class TtsQueue {
  private readonly url: string | undefined;
  private readonly token: string | undefined;
  private readonly prefix: string;
  readonly limit: number;
  constructor() {
    this.url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, "");
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    const namespace = process.env.TTS_QUEUE_NAMESPACE?.trim() || `ttarot-${process.env.VERCEL_ENV || "local"}`;
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(namespace)) throw new Error("TTS_QUEUE_NAMESPACE không hợp lệ.");
    this.prefix = `tts:{${namespace}}:`;
    // Keep existing deployments working; the handoff's env takes precedence.
    const number = Number(process.env.TTS_MAX_CONCURRENCY || process.env.TTS_MAX_CONCURRENT || 5);
    this.limit = Number.isInteger(number) && number >= 1 && number <= 20 ? number : 5;
    if (Boolean(this.url) !== Boolean(this.token)) throw new Error("Hãy cấu hình đủ URL và token Upstash Redis.");
    if (!this.url && (process.env.VERCEL || process.env.NODE_ENV === "production")) throw new Error("TTS trên production cần Upstash Redis để giới hạn concurrency trên mọi instance.");
  }
  private keys(id: string) { return [this.prefix + "waiting", this.prefix + "active", this.prefix + "job:" + id, this.prefix + "sequence"]; }
  private async command(command: Array<string | number>): Promise<unknown> {
    const response = await fetch(this.url!, { method: "POST", headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" }, body: JSON.stringify(command), cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Không thể kết nối hàng chờ giọng đọc.");
    const data = await response.json() as { result?: unknown; error?: string };
    if (data.error) throw new Error("Hàng chờ giọng đọc gặp sự cố.");
    return data.result;
  }
  private eval(script: string, id: string, args: Array<string | number>) { const keys = this.keys(id); return this.command(["EVAL", script, keys.length, ...keys, ...args]); }
  private local(id: string, owner: string) {
    const now = Date.now();
    for (const [key, job] of localJobs) if (job.expires <= now) localJobs.delete(key);
    const job = localJobs.get(this.prefix + id);
    if (!job || job.owner !== owner) throw new Error("Không tìm thấy lượt nghe.");
    return job;
  }
  async enqueue(id: string, owner: string, text: string, readingStyle: unknown = "default"): Promise<JobStatus> {
    const normalizedStyle = normalizeTtsReadingStyle(readingStyle);
    if (this.url) {
      const result = await this.eval(ENQUEUE_LUA, id, [id, owner, text, TTL_SECONDS, WAIT_LEASE_MS, normalizedStyle]);
      if (result === "forbidden") throw new Error("Không tìm thấy lượt nghe.");
      return result as JobStatus;
    }
    const key = this.prefix + id, old = localJobs.get(key);
    if (old && old.expires > Date.now()) { if (old.owner !== owner) throw new Error("Không tìm thấy lượt nghe."); return old.status; }
    localJobs.set(key, { owner, text, readingStyle: normalizedStyle, status: "waiting", sequence: ++sequence, expires: Date.now() + TTL_SECONDS * 1000, waitDeadline: Date.now() + WAIT_LEASE_MS });
    return "waiting";
  }
  async claim(id: string, owner: string): Promise<Claim> {
    if (this.url) {
      const result = await this.eval(CLAIM_LUA, id, [id, owner, this.limit, LEASE_MS, this.prefix + "job:", TTL_SECONDS, WAIT_LEASE_MS]) as string[];
      if (!result || result[0] === "forbidden") throw new Error("Không tìm thấy lượt nghe.");
      return { status: result[0] as Claim["status"], text: result[1], readingStyle: normalizeTtsReadingStyle(result[2]) };
    }
    const job = this.local(id, owner), now = Date.now();
    if (job.status !== "waiting") return { status: job.status };
    job.waitDeadline = now + WAIT_LEASE_MS;
    const entries = [...localJobs.entries()].filter(([key]) => key.startsWith(this.prefix));
    for (const [, item] of entries) if (item.status === "waiting" && (item.waitDeadline || 0) <= now) { item.status = "cancelled"; item.text = ""; }
    const active = entries.filter(([key, item]) => (item.status === "running" || item.status === "cancelled") && (item.deadline || 0) > now);
    const head = entries.filter(([, item]) => item.status === "waiting").sort((a, b) => a[1].sequence - b[1].sequence)[0]?.[1];
    if (active.length >= this.limit || head !== job) return { status: "waiting" };
    job.status = "running"; job.deadline = now + LEASE_MS;
    return { status: "claimed", text: job.text, readingStyle: normalizeTtsReadingStyle(job.readingStyle) };
  }
  async isCancelled(id: string, owner: string) {
    if (this.url) {
      const result = await this.command(["HMGET", this.keys(id)[2], "owner", "status"]) as string[];
      return !result || result[0] !== owner || result[1] === "cancelled";
    }
    return this.local(id, owner).status === "cancelled";
  }
  async finish(id: string, owner: string, status: "done" | "error" | "cancelled") {
    if (this.url) { await this.eval(FINISH_LUA, id, [id, owner, status]); return; }
    const job = this.local(id, owner); job.deadline = undefined; job.text = "";
    if (job.status !== "cancelled") job.status = status;
  }
  async cancel(id: string, owner: string) {
    if (this.url) { if (await this.eval(CANCEL_LUA, id, [id, owner, TTL_SECONDS]) === "forbidden") throw new Error("Không tìm thấy lượt nghe."); }
    else {
      const key = this.prefix + id, old = localJobs.get(key);
      if (old && old.owner !== owner) throw new Error("Không tìm thấy lượt nghe.");
      if (old) { old.status = "cancelled"; old.text = ""; }
      else localJobs.set(key, { owner, text: "", status: "cancelled", sequence: ++sequence, expires: Date.now() + TTL_SECONDS * 1000 });
    }
    localControllers.get(this.prefix + id)?.abort();
  }
  track(id: string, controller: AbortController) { const key = this.prefix + id; localControllers.set(key, controller); return () => localControllers.delete(key); }
}
