/* Web Audio scheduling tests, without real sound or provider calls.
 * Run: node scripts/test-tts-playback.cjs
 * Optional jsdom also exercises the real React hook and controls.
 */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), project = path.resolve(__dirname, '..'), cache = new Map();
const { webcrypto } = require('node:crypto');
const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
function load(relative) {
  const file = path.resolve(project, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(project); cache.set(file, m);
  const native = m.require.bind(m);
  m.require = name => name === '@/lib/supabase/auth-fetch' ? { getApiAuthHeaders: async () => ({ Authorization: 'Bearer fixture-session' }) } : name.startsWith('@/') ? load(name.slice(2) + '.ts') : native(name);
  m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
  return m.exports;
}
const contexts = [];
class AudioContextFixture {
  constructor() { this.currentTime = 0; this.state = 'suspended'; this.destination = {}; this.sources = []; this.buffers = []; contexts.push(this); }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
  createBuffer(channels, length, rate) {
    assert.equal(channels, 1); const samples = new Float32Array(length);
    const result = { duration: length / rate, getChannelData: () => samples, samples }; this.buffers.push(result); return result;
  }
  createBufferSource() {
    const source = { connect() {}, disconnect() { this.disconnected = true; }, start(time) { this.startTime = time; }, stop() { this.stopped = true; }, end() { this.onended?.(); } };
    this.sources.push(source); return source;
  }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const pcm = Buffer.alloc(4800); pcm.writeInt16LE(16384, 0); pcm.writeInt16LE(-16384, 2);
const encoded = pcm.toString('base64');
(async () => {
  const { createTtsJobId } = load('lib/tts/job-id.ts');
  const nativeId = '9f354ecd-4bd7-4cb6-bb26-a85c0532bdde';
  const modernCrypto = { randomUUID() { assert.equal(this, modernCrypto); return nativeId; } };
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: modernCrypto });
  assert.equal(createTtsJobId(), nativeId);
  // Reproduce iOS 15: Web Crypto present, randomUUID unavailable.
  const legacyCrypto = { getRandomValues(values) { return webcrypto.getRandomValues(values); } };
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: legacyCrypto });
  const ids = Array.from({ length: 1000 }, () => createTtsJobId());
  assert.equal(new Set(ids).size, 1000);
  assert(ids.every(id => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)));
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {} });
  assert.throws(createTtsJobId, /Trình duyệt/);
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: legacyCrypto });
  console.log('PASS UUID: native method binding, iOS without randomUUID, 1000 secure unique UUIDv4, unsupported browser error');
  global.window = { AudioContext: AudioContextFixture };
  const { PcmPlayer } = load('lib/tts/player.ts'), events = [], player = new PcmPlayer(value => events.push(value)), abort = new AbortController();
  await player.unlock(); await player.append(encoded, 24000, abort.signal);
  assert.equal(player.context.buffers[0].samples[0], .5); assert.equal(player.context.buffers[0].samples[1], -.5);
  assert.equal(player.context.sources[0].startTime, .05); assert.deepEqual(events, [true]);
  await player.append(encoded, 24000, abort.signal); assert(Math.abs(player.context.sources[1].startTime - .15) < .00001);
  await player.pause(); assert.equal(player.context.state, 'suspended');
  await player.append(encoded, 24000, abort.signal); assert.equal(player.context.sources.length, 2);
  await player.resume(); assert.equal(player.context.sources.length, 3);
  player.context.sources.forEach(source => source.end()); await player.drain(abort.signal); assert.deepEqual(events, [true, false]);
  player.stop(); assert.equal(player.context.state, 'closed');
  const bounded = new PcmPlayer(() => {}), cancel = new AbortController(); await bounded.unlock();
  for (let i = 0; i < 80; i++) await bounded.append(encoded, 24000, cancel.signal);
  for (let i = 0; i < 4000; i++) await bounded.append(encoded, 24000, cancel.signal);
  assert.equal(bounded.context.sources.length, 80, 'long audio is received without scheduling thousands of nodes');
  bounded.context.currentTime = 4; await delay(110); assert(bounded.context.sources.length > 80);
  cancel.abort(); await assert.rejects(bounded.append(encoded, 24000, cancel.signal)); bounded.stop();
  assert(bounded.context.sources.every(source => source.stopped));
  console.log('PASS PCM decoding, contiguous/early playback, Pause/Resume, long audio queue without blocking generation, bounded scheduling, Stop');
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); } catch { console.log('SKIP React hook controls: optional jsdom not installed'); return; }
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://tts.local/' });
  global.window = dom.window; global.document = dom.window.document; global.HTMLElement = dom.window.HTMLElement;
  global.IS_REACT_ACT_ENVIRONMENT = true; window.webkitAudioContext = AudioContextFixture;
  const React = require('react'), { createRoot } = require('react-dom/client'), { act } = React;
  const { useTtsPlayback } = load('components/useTtsPlayback.ts');
  let hook, streamController, networkSignal, requests = [];
  const nativeFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    const method = options.method || 'GET'; requests.push({ method, url, options });
    if (method === 'DELETE') return Response.json({ status: 'cancelled' });
    if (method === 'POST') return Response.json({ status: 'waiting' }, { status: 202 });
    networkSignal = options.signal;
    const body = new ReadableStream({ start(controller) { streamController = controller; }, cancel() {} });
    return new Response(body);
  };
  const Fixture = () => {
    hook = useTtsPlayback();
    return React.createElement('div', null,
      React.createElement('b', null, hook.speechStatus),
      React.createElement('button', { onClick: () => void hook.startReadingAloud('Nội dung bài đọc', 'gentle') }, 'Nghe'),
      React.createElement('button', { onClick: () => void hook.toggleSpeechPause() }, 'Pause'),
      React.createElement('button', { onClick: hook.stopReadingAloud }, 'Stop'));
  };
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(Fixture)));
    assert.equal(requests.length, 0, 'mount must not generate audio');
    await act(async () => {
      document.querySelector('button').click(); document.querySelector('button').click(); await delay(20);
    });
    assert.equal(requests.filter(request => request.method === 'POST').length, 1, 'two rapid clicks enqueue once');
    const body = JSON.parse(requests.find(request => request.method === 'POST').options.body);
    assert.equal(body.readingStyle, 'gentle'); assert.equal(body.text, 'Nội dung bài đọc');
    assert(!('voice' in body)); assert(!('style' in body));
    assert(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(body.jobId));
    assert.equal(hook.speechStatus, 'waiting');
    const context = contexts.at(-1);
    await act(async () => {
      streamController.enqueue(new TextEncoder().encode(JSON.stringify({ type: 'status', status: 'generating' }) + '\n'));
      await delay(10);
    });
    assert.equal(hook.speechStatus, 'generating');
    await act(async () => {
      streamController.enqueue(new TextEncoder().encode(JSON.stringify({ type: 'audio', data: encoded, rate: 24000 }) + '\n')); await delay(10);
    });
    assert.equal(hook.speechStatus, 'speaking'); assert.equal(context.sources.length, 1, 'playback starts while response remains open');
    await act(async () => hook.toggleSpeechPause()); assert.equal(hook.speechStatus, 'paused'); assert.equal(context.state, 'suspended');
    await act(async () => {
      streamController.enqueue(new TextEncoder().encode(JSON.stringify({ type: 'audio', data: encoded, rate: 24000 }) + '\n')); await delay(10);
    });
    assert.equal(context.sources.length, 1, 'audio received while paused stays queued');
    await act(async () => hook.toggleSpeechPause()); assert.equal(hook.speechStatus, 'speaking'); assert.equal(context.state, 'running');
    assert.equal(context.sources.length, 2, 'resume schedules received audio without another request');
    assert.equal(requests.filter(request => request.method === 'POST').length, 1, 'resume must not regenerate');
    await act(async () => { hook.stopReadingAloud(); await delay(10); });
    assert.equal(networkSignal.aborted, true); assert.equal(context.state, 'closed'); assert.equal(hook.speechStatus, 'idle');
    assert.equal(requests.filter(request => request.method === 'DELETE').length, 1);
    // Closing an already cancelled fixture stream releases the pending read.
    streamController.close(); await act(async () => { await delay(10); });
    await act(async () => { void hook.startReadingAloud('Waiting test'); await delay(10); });
    assert.equal(JSON.parse(requests.filter(request => request.method === 'POST').at(-1).options.body).readingStyle, 'default');
    await act(async () => { hook.stopReadingAloud(); await delay(10); });
    assert.equal(hook.speechStatus, 'idle'); streamController.close(); await act(async () => { await delay(10); });
    await act(async () => { void hook.startReadingAloud('Unmount test'); await delay(10); });
    await act(async () => root.unmount()); assert.equal(networkSignal.aborted, true); assert.equal(contexts.at(-1).state, 'closed'); streamController.close();
    console.log('PASS real React hook: no calls on mount, rapid-click guard, streamed playback, Pause/Resume without regeneration, Stop waiting/playing, unmount cleanup');
  } finally { global.fetch = nativeFetch; dom.window.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
  else delete globalThis.crypto;
});
