/* Offline API/stream tests. Google is replaced by a local HTTP SSE provider.
 * Optional: TTS_TEST_REDIS_REST_URL/TOKEN runs the same checks against Redis
 * (use a TEST database). No real Gemini, CKEY or APIZ credentials are needed.
 * Run: node scripts/test-tts.cjs
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { randomUUID, createHash } = require('node:crypto');
const ts = require('typescript');
const project = path.resolve(__dirname, '..'), cache = new Map();
function load(relative) {
  const file = path.resolve(project, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const item = new Module(file, module); item.filename = file; item.paths = Module._nodeModulePaths(project); cache.set(file, item);
  const native = item.require.bind(item);
  item.require = name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : native(name);
  item._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
  return item.exports;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const before = { ...process.env }, nativeFetch = global.fetch;
const calls = [];
// SHA-256 values taken independently from the supplied handoff, not from code.
const expected = {
  default: { voice: 'Fola', hash: '100d4e7ec698606f23435096e8b73cb1b3c8981626659cae11e58802f18109d3' },
  direct: { voice: 'Fola', hash: '7984faff0724b392751bfe445acc63c10c037eefcb1b5d1840827ebaa67fd3af' },
  gentle: { voice: 'Gacrux', hash: '336d3f58d4bb26f6d1f8b0ce52d8cf88bb80f09351f56ac6a01644d9259c11cf' },
  companion: { voice: 'Gacrux', hash: '336d3f58d4bb26f6d1f8b0ce52d8cf88bb80f09351f56ac6a01644d9259c11cf' }
};
function assertPreset(payload, style) {
  const preset = expected[style];
  assert.equal(payload.generationConfig.speechConfig.voiceConfig.voice, preset.voice);
  assert.equal(createHash('sha256').update(payload.contents[0].parts[0].speech_metadata.style).digest('hex'), preset.hash);
}
let active = 0, maxActive = 0, retryCount = 0, completed = 0;
const pcm = Buffer.alloc(4800); pcm.writeInt16LE(16384, 0); pcm.writeInt16LE(-16384, 2);
const audioEvent = () => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: pcm.toString('base64') } }] } }] })}\n\n`;
const server = http.createServer(async (request, response) => {
  let body = ''; for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body), text = payload.contents[0].parts[0].text;
  calls.push({ text, payload, key: request.headers['x-goog-api-key'] });
  assert.equal(request.headers['x-goog-api-key'], 'fake-tts-key');
  if (text === 'retry' && retryCount++ === 0) { response.writeHead(429, { 'Retry-After': '.5' }); response.end('{}'); return; }
  if (text === 'always-429') { response.writeHead(429, { 'Retry-After': '.5' }); response.end('{}'); return; }
  active++; maxActive = Math.max(maxActive, active); let released = false;
  const release = () => { if (!released) { released = true; active--; } };
  response.on('close', release); response.on('finish', release);
  response.writeHead(200, { 'Content-Type': 'text/event-stream' }); response.flushHeaders();
  const frame = Buffer.from(audioEvent()); response.write(frame.subarray(0, 13)); response.write(frame.subarray(13));
  if (text === 'hold') return;
  await delay(80);
  if (response.destroyed) return;
  if (text === 'late-error') { response.end('data: {"error":{"code":429}}\n\n'); return; }
  response.write(audioEvent()); await delay(30);
  if (!response.destroyed) { completed++; response.end('data: {"candidates":[{"finishReason":"STOP"}]}\n\n'); }
});
function request(method, id, text, signal, extra = {}) {
  return new Request(`http://localhost/api/tts${method === 'POST' ? '' : '?jobId=' + id}`, { method, signal, ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: id, text, ...extra }) } : {}) });
}
async function consume(response) {
  assert.equal(response.status, 200);
  const rows = (await response.text()).trim().split('\n').map(JSON.parse);
  assert(rows.some(row => row.type === 'audio'));
  assert.equal(rows.at(-1).type, 'done');
  return rows;
}
async function flow(api, text, readingStyle, extra = {}) {
  const id = randomUUID(); assert.equal((await api.POST(request('POST', id, text, undefined, { readingStyle, ...extra }))).status, 202);
  for (let i = 0; i < 500; i++) {
    const response = await api.GET(request('GET', id));
    if (response.status !== 202) return consume(response);
    assert(['waiting', 'running'].includes((await response.json()).status)); await delay(15);
  }
  throw new Error('Queue did not drain');
}
async function suite(api, backend) {
  const start = calls.length, id = randomUUID();
  assert.equal((await api.POST(request('POST', id, 'short', undefined, { readingStyle: 'gentle' }))).status, 202);
  assert.equal((await api.POST(request('POST', id, 'different text same click', undefined, { readingStyle: 'direct' }))).status, 202);
  assert.equal(calls.length, start, 'enqueue must not call Gemini');
  const response = await api.GET(request('GET', id)), reader = response.body.getReader();
  assert.equal((await api.GET(request('GET', id))).status, 202, 'duplicate GET must not generate twice');
  await reader.read(); // status
  const first = JSON.parse(new TextDecoder().decode((await reader.read()).value));
  assert.equal(first.type, 'audio'); assert.equal(first.rate, 24000);
  assert.equal(calls.length, start + 1); assert.equal(calls.at(-1).text, 'short');
  assert(active > 0, 'first audio arrives before generation completes');
  while (!(await reader.read()).done) {} reader.releaseLock();
  const payload = calls[start].payload;
  assertPreset(payload, 'gentle'); // Replayed POST cannot change the original queued style.
  assert.equal(payload.generationConfig.responseFormat.audio.mimeType, 'AUDIO_L16');
  for (const style of Object.keys(expected)) {
    await flow(api, 'preset-' + style, style, { voice: 'Untrusted voice', style: 'Untrusted prompt' });
    assertPreset(calls.at(-1).payload, style);
  }
  for (const value of [undefined, null, '', 'invalid', '__proto__', 42, { voice: 'Gacrux' }]) {
    await flow(api, 'fallback-style', value, { voice: 'Gacrux', style: 'Untrusted prompt' });
    assertPreset(calls.at(-1).payload, 'default');
  }
  maxActive = 0;
  const beforeBatch = calls.length;
  const styles = Object.keys(expected);
  await Promise.all(Array.from({ length: 20 }, (_, n) => flow(api, `concurrent-${n}`, styles[n % 4])));
  assert.equal(calls.length - beforeBatch, 20); assert.equal(maxActive, 5); assert.equal(active, 0);
  for (const call of calls.slice(beforeBatch)) assertPreset(call.payload, styles[Number(call.text.split('-')[1]) % 4]);
  // Two isolated queue objects emulate separate serverless invocations.
  const { TtsQueue } = load('lib/tts/queue.ts'), a = new TtsQueue(), b = new TtsQueue();
  const ids = Array.from({ length: 6 }, () => randomUUID());
  for (const id of ids) await a.enqueue(id, 'owner', 'queue-only');
  for (let i = 0; i < 5; i++) assert.equal((await (i % 2 ? a : b).claim(ids[i], 'owner')).status, 'claimed');
  assert.equal((await b.claim(ids[5], 'owner')).status, 'waiting');
  await b.cancel(ids[0], 'owner');
  assert.equal((await a.claim(ids[5], 'owner')).status, 'waiting', 'cancel must retain lease until upstream stops');
  await a.finish(ids[0], 'owner', 'cancelled');
  assert.equal((await b.claim(ids[5], 'owner')).status, 'claimed');
  for (const id of ids.slice(1)) await a.finish(id, 'owner', 'done');
  const cancelled = randomUUID(), previous = calls.length;
  await api.DELETE(request('DELETE', cancelled)); // Stop can beat initial enqueue.
  assert.equal((await api.POST(request('POST', cancelled, 'cancelled'))).status, 202);
  assert.equal((await (await api.GET(request('GET', cancelled))).json()).status, 'cancelled');
  assert.equal(calls.length, previous);
  const held = randomUUID(); await api.POST(request('POST', held, 'hold'));
  const controller = new AbortController(), live = await api.GET(request('GET', held, undefined, controller.signal));
  const liveReader = live.body.getReader(); await liveReader.read(); await liveReader.read();
  await api.DELETE(request('DELETE', held)); controller.abort(); await liveReader.cancel(); liveReader.releaseLock();
  await delay(30); assert.equal(active, 0, 'Stop cancels upstream');
  // Abort before consuming even the status frame: cleanup must not wait for pull.
  const parked = randomUUID(), parkedAbort = new AbortController();
  await api.POST(request('POST', parked, 'unconsumed'));
  const parkedResponse = await api.GET(request('GET', parked, undefined, parkedAbort.signal)); parkedAbort.abort();
  await delay(30);
  const probes = Array.from({ length: 5 }, () => randomUUID());
  for (const probe of probes) { await a.enqueue(probe, 'owner', 'probe'); assert.equal((await b.claim(probe, 'owner')).status, 'claimed', 'unconsumed abort must release the slot'); }
  for (const probe of probes) await a.finish(probe, 'owner', 'done');
  await parkedResponse.body.cancel();
  console.log(`PASS ${backend}: 4 presets/exact handoff styles, untrusted fields ignored, queued-style persistence, early streaming, 20 jobs/max=5, FIFO, idempotency, cancellation`);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  global.fetch = (url, options) => String(url).startsWith('https://generativelanguage.googleapis.com/') ? nativeFetch(`http://127.0.0.1:${port}/gemini`, options) : nativeFetch(url, options);
  process.env.NODE_ENV = 'test'; process.env.GEMINI_API_KEY = 'fake-tts-key';
  delete process.env.VERCEL; delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.TTS_MAX_CONCURRENT = '5'; process.env.TTS_MAX_CONCURRENCY = '5'; process.env.TTS_QUEUE_NAMESPACE = 'test-local-' + randomUUID();
  const api = load('app/api/tts/route.ts');
  const { TtsQueue } = load('lib/tts/queue.ts');
  process.env.TTS_MAX_CONCURRENCY = '2'; assert.equal(new TtsQueue().limit, 2);
  delete process.env.TTS_MAX_CONCURRENCY; assert.equal(new TtsQueue().limit, 5);
  delete process.env.TTS_MAX_CONCURRENT; assert.equal(new TtsQueue().limit, 5);
  process.env.TTS_MAX_CONCURRENCY = 'invalid'; assert.equal(new TtsQueue().limit, 5);
  process.env.TTS_MAX_CONCURRENCY = '5';
  assert.equal((await api.POST(request('POST', randomUUID(), ''))).status, 400);
  assert.equal((await api.POST(request('POST', randomUUID(), 'x'.repeat(16001)))).status, 400);
  assert.equal((await api.GET(request('GET', 'invalid'))).status, 400);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'fake';
  assert.equal((await api.POST(request('POST', randomUUID(), 'unauthenticated'))).status, 401);
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NODE_ENV = 'production'; assert.equal((await api.POST(request('POST', randomUUID(), 'no redis'))).status, 503); process.env.NODE_ENV = 'test';
  await suite(api, 'local');
  const { geminiAudio } = load('lib/tts/gemini.ts');
  let count = calls.length;
  for await (const chunk of geminiAudio('retry', new AbortController().signal)) assert(chunk.data);
  assert.equal(calls.length - count, 2);
  count = calls.length;
  await assert.rejects(async () => { for await (const chunk of geminiAudio('always-429', new AbortController().signal)) {} });
  assert.equal(calls.length - count, 4);
  count = calls.length;
  await assert.rejects(async () => { for await (const chunk of geminiAudio('late-error', new AbortController().signal)) {} });
  assert.equal(calls.length - count, 1, 'never restart after streamed content');
  const long = 'Tarot 6 lá. ' + 'The Fool xuôi, The Magician xuôi, Two of Cups ngược, Six of Swords xuôi, Queen of Pentacles xuôi, The Star xuôi. Bạn cần quan sát hành động thực tế và giữ giới hạn của mình. '.repeat(35);
  await flow(api, long, 'direct'); assert.equal(calls.at(-1).text, long.trim()); assertPreset(calls.at(-1).payload, 'direct');
  console.log('PASS validation/auth, production requires Redis, 429 retry bounds, no retry after audio, long 6-card payload');
  if (before.TTS_TEST_REDIS_REST_URL && before.TTS_TEST_REDIS_REST_TOKEN) {
    process.env.UPSTASH_REDIS_REST_URL = before.TTS_TEST_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = before.TTS_TEST_REDIS_REST_TOKEN;
    process.env.TTS_QUEUE_NAMESPACE = 'tts-test-' + randomUUID(); process.env.NODE_ENV = 'production';
    await suite(api, 'distributed Redis/Lua');
    const { TtsQueue } = load('lib/tts/queue.ts'), queue = new TtsQueue(), abandoned = randomUUID(), next = randomUUID();
    await queue.enqueue(abandoned, 'owner', 'abandoned'); await queue.enqueue(next, 'owner', 'next');
    const prefix = `tts:{${process.env.TTS_QUEUE_NAMESPACE}}:`;
    const redis = command => nativeFetch(process.env.UPSTASH_REDIS_REST_URL, { method: 'POST', headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
    await redis(['HSET', prefix + 'job:' + abandoned, 'waitDeadline', '0']);
    assert.equal((await queue.claim(next, 'owner')).status, 'claimed', 'abandoned waiter cannot block FIFO');
    assert.equal((await queue.claim(abandoned, 'owner')).status, 'cancelled');
    await queue.finish(next, 'owner', 'done');
    const legacy = randomUUID(); await queue.enqueue(legacy, 'owner', 'legacy');
    await redis(['HDEL', prefix + 'job:' + legacy, 'readingStyle']);
    assert.equal((await new TtsQueue().claim(legacy, 'owner')).readingStyle, 'default');
    await queue.finish(legacy, 'owner', 'done');
    console.log('PASS abandoned-waiter recovery (actual Redis Lua)');
  } else console.log('SKIP distributed Redis: set TTS_TEST_REDIS_REST_URL and TTS_TEST_REDIS_REST_TOKEN to a TEST database');
  console.log('TTS API tests PASS');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  global.fetch = nativeFetch;
  for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key]; Object.assign(process.env, before);
  server.closeAllConnections(); server.close();
});
