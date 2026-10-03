/* Internal verification: real HTTP/SSE against two local test providers.
   No real API keys, no calls to CKEY/APIZ, no changes to the Reader prompts. */
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const project = path.resolve(__dirname, '..');
const file = path.join(project, 'lib/xah.ts');
const moduleUnderTest = new Module(file, module);
moduleUnderTest.filename = file;
moduleUnderTest.paths = Module._nodeModulePaths(project);
const envBefore = { ...process.env };
const logs = [];
const originalInfo = console.info;
console.info = (...args) => { logs.push(args); };
let mode = 'ok';
let failId = 'ckey';
let calls = [];
let active = 0, maxActive = 0;
let heldResponse;
const message = [{ role: 'system', content: 'Reader rules: unchanged.' }, { role: 'user', content: JSON.stringify({ question: 'Test ngắn', spread: 'six', cards: [{ name: 'The Fool', orientation: 'reversed' }], readingStyle: 'direct' }) }];
const event = text => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = http.createServer(async (req, res) => {
  const id = req.url.startsWith('/ckey/') ? 'ckey' : 'apiz';
  active++; maxActive = Math.max(maxActive, active);
  let finished = false;
  const release = () => { if (!finished) { finished = true; active--; } };
  res.on('close', release); res.on('finish', release);
  let body = '';
  for await (const chunk of req) body += chunk;
  calls.push({ id, body: JSON.parse(body), auth: req.headers.authorization });
  assert.equal(req.headers.authorization, `Bearer fake-${id}`);
  if (id === failId && mode === 'http-error') { res.writeHead(503); res.end('{"error":{"message":"Test error"}}'); return; }
  if (mode === 'both-error') { res.writeHead(503); res.end('{}'); return; }
  if (id === failId && mode === 'bad-request') { res.writeHead(400); res.end('{}'); return; }
  if (id === failId && mode === 'network-error') { release(); res.destroy(); return; }
  if (id === failId && mode === 'before-headers-timeout') { heldResponse = res; return; }
  res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.flushHeaders();
  if (id === failId && mode === 'empty') { res.end('data: [DONE]\n\n'); return; }
  if (id === failId && mode === 'invalid-json') { res.end('data: nope\n\n'); return; }
  if (id === failId && mode === 'sse-error') { res.end('data: {"error":{"message":"Stream error"}}\n\n'); return; }
  if (id === failId && mode === 'before-content-timeout') { res.write('data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n'); heldResponse = res; return; }
  if (id === failId && mode === 'json') { res.end(JSON.stringify({ choices: [{ message: { content: 'JSON result' } }] })); return; }
  if (id !== failId && mode === 'cancel-fallback') { heldResponse = res; return; }
  if (id === failId && mode === 'cancel-fallback') { res.end('data: [DONE]\n\n'); return; }
  // Split SSE frames and UTF-8 bytes, then stream the remainder separately.
  const encoded = Buffer.from(event('Bài đọc: '));
  res.write(encoded.subarray(0, 8)); res.write(encoded.subarray(8, 22)); res.write(encoded.subarray(22));
  await delay(15);
  if (id === failId && mode === 'after-content-error') { res.write('data: {"error":{"message":"Late failure"}}\n\n'); res.end(); return; }
  if (id === failId && mode === 'after-content-timeout') { heldResponse = res; return; }
  if (mode === 'cancel') { heldResponse = res; return; }
  res.write(event('rõ ràng.'));
  // [DONE] stops parsing; do not wait for the server to close the socket.
  res.end('data: [DONE]\n\n');
});
async function consume(stream) {
  const reader = stream.getReader(); const decoder = new TextDecoder(); let text = '';
  try { while (true) { const chunk = await reader.read(); if (chunk.done) break; text += decoder.decode(chunk.value, { stream: true }); } return text + decoder.decode(); }
  finally { reader.releaseLock(); }
}
function forceProvider(id) {
  process.env.AI_CKEY_WEIGHT = id === 'ckey' ? '100' : '0';
  process.env.AI_APIZ_WEIGHT = id === 'apiz' ? '100' : '0';
}
function assertPayload() {
  for (const call of calls) assert.deepEqual(call.body, { model: 'gpt-6-astra', messages: message, stream: true });
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, { XAH_API_KEY: 'fake-ckey', XAH_BASE_URL: url + '/ckey', XAH_PREMIUM_MODEL: 'gpt-6-astra', APIZ_API_KEY: 'fake-apiz', APIZ_BASE_URL: url + '/apiz', APIZ_MODEL: 'gpt-6-astra', XAH_FIRST_BYTE_TIMEOUT_MS: '5000', XAH_STREAM_TIMEOUT_MS: '30000' });
  // Shorten only the test timer clock, keeping the production values untouched.
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (cb, ms, ...args) => originalSetTimeout(cb, ms === 5000 ? 100 : ms === 30000 ? 150 : ms, ...args);
  moduleUnderTest._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, file);
  const router = moduleUnderTest.exports;
  assert.equal(router.selectProviderByWeight({ ckey: 50, apiz: 50 }, .4999), 'ckey');
  assert.equal(router.selectProviderByWeight({ ckey: 50, apiz: 50 }, .5), 'apiz');
  assert.equal(router.selectProviderByWeight({ ckey: 80, apiz: 20 }, .7999), 'ckey');
  assert.equal(router.selectProviderByWeight({ ckey: 80, apiz: 20 }, .8), 'apiz');
  assert.throws(() => router.selectProviderByWeight({ ckey: 0, apiz: 0 }));
  delete process.env.AI_CKEY_WEIGHT; delete process.env.AI_APIZ_WEIGHT;
  const distribution = { ckey: 0, apiz: 0 };
  for (let index = 0; index < 100; index++) {
    calls = []; const beforeLogs = logs.length;
    assert.equal(await consume(await router.tarotReaderChatStream(message)), 'Bài đọc: rõ ràng.');
    assert.equal(calls.length, 1, 'normal request must call only one provider');
    assertPayload(); distribution[calls[0].id]++;
    const final = logs.slice(beforeLogs).at(-1)[1];
    assert.equal(final.provider_used, calls[0].id); assert.equal(final.fallback_used, false);
  }
  assert(distribution.ckey > 0 && distribution.apiz > 0);
  originalInfo(`PASS 100 real local HTTP/SSE requests: CKEY=${distribution.ckey}, APIZ=${distribution.apiz}; exactly one outbound request each.`);
  for (const id of ['ckey', 'apiz']) {
    failId = id; forceProvider(id);
    for (const scenario of ['http-error', 'bad-request', 'network-error', 'empty', 'invalid-json', 'sse-error', 'before-headers-timeout', 'before-content-timeout']) {
      mode = scenario; calls = []; const beforeLogs = logs.length;
      assert.equal(await consume(await router.tarotReaderChatStream(message)), 'Bài đọc: rõ ràng.');
      assert.deepEqual(calls.map(c => c.id), [id, id === 'ckey' ? 'apiz' : 'ckey']); assertPayload();
      const final = logs.slice(beforeLogs).at(-1)[1];
      assert.equal(final.provider_selected, id); assert.notEqual(final.provider_used, id); assert.equal(final.fallback_used, true); assert(final.first_provider_error);
    }
    for (const scenario of ['after-content-error', 'after-content-timeout']) {
      mode = scenario; calls = [];
      const stream = await router.tarotReaderChatStream(message); const reader = stream.getReader();
      const first = await reader.read(); assert(new TextDecoder().decode(first.value).startsWith('Bài đọc:'));
      await assert.rejects(async () => { while (!(await reader.read()).done) {} }); reader.releaseLock();
      assert.equal(calls.length, 1, 'after first content, never call other provider');
    }
  }
  mode = 'both-error'; calls = []; await assert.rejects(router.tarotReaderChatStream(message)); assert.equal(calls.length, 2, 'no third retry');
  mode = 'json'; forceProvider(failId); calls = []; assert.equal(await consume(await router.tarotReaderChatStream(message)), 'JSON result'); assert.equal(calls.length, 1);
  mode = 'cancel'; calls = []; const stream = await router.tarotReaderChatStream(message); const reader = stream.getReader(); await reader.read(); await reader.cancel(); await delay(40); assert.equal(calls.length, 1); reader.releaseLock();
  mode = 'cancel-fallback'; calls = []; const pendingStream = await router.tarotReaderChatStream(message); for (let i = 0; calls.length < 2 && i < 20; i++) await delay(5); await pendingStream.cancel(); await delay(30); assert.equal(calls.length, 2);
  // Existing non-reader helper ignores APIZ/random routing (Lenormand/Prompt Lab).
  mode = 'ok'; calls = []; process.env.XAH_FALLBACK_API_KEY = 'fake-apiz'; process.env.XAH_FALLBACK_BASE_URL = url + '/apiz'; process.env.XAH_FALLBACK_PREMIUM_MODEL = 'lab-model';
  assert.equal(await consume(await router.xahChatStream(message, 'lab-model', 'fallback_1')), 'Bài đọc: rõ ràng.');
  assert.equal(calls.length, 1); assert.equal(calls[0].id, 'apiz'); assert.equal(calls[0].body.model, 'lab-model');
  calls = []; forceProvider('apiz'); await consume(await router.xahChatStream(message, 'lenormand-model')); assert.equal(calls.length, 1); assert.equal(calls[0].id, 'ckey'); assert.equal(calls[0].body.model, 'lenormand-model');
  originalInfo('PASS fallback in both directions before content, HTTP/network/SSE errors, timeouts, no fallback after content, cancellation, identical payloads, existing Lenormand/Prompt Lab helper.');
  originalInfo('PASS maximum concurrent provider requests:', maxActive); assert.equal(maxActive, 1);
  assert(!JSON.stringify(logs).includes('fake-'), 'logs never contain keys');
  originalInfo('Example logs:', logs.find(x => x[1]?.provider_used === 'ckey' && !x[1]?.fallback_used), logs.find(x => x[1]?.fallback_used && x[1]?.provider_used));
  global.setTimeout = originalSetTimeout;
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  console.info = originalInfo;
  for (const key of Object.keys(process.env)) if (!(key in envBefore)) delete process.env[key];
  Object.assign(process.env, envBefore);
  heldResponse?.destroy(); server.closeAllConnections(); server.close();
});
