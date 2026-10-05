const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const file = path.join(__dirname, '../lib/lenormand/history.ts');
const mod = new Module(file, module);
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, file);
const { parseLenormandHistory } = mod.exports;
for (const [spread, count] of Object.entries({ line3: 3, line5: 5, box9: 9, grand_tableau: 36 })) {
  const entry = { id: 'test', savedAt: new Date().toISOString(), question: 'Câu hỏi', timeframe: '3 tháng',
    significator: 'woman', spread, mode: 'random', readingStyle: 'gentle', reading: 'Bài đọc đã hoàn tất',
    cards: Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Card ${i}`, vi: `Lá ${i}`, position: i })) };
  assert.deepEqual(parseLenormandHistory(JSON.stringify([entry]), 5), [entry]);
  assert.equal(parseLenormandHistory(JSON.stringify([entry, { ...entry, id: 'second' }]), 1).length, 1);
  assert.equal(parseLenormandHistory(JSON.stringify([entry]), 0).length, 0);
  assert.equal(parseLenormandHistory(JSON.stringify([{ ...entry, cards: Array(count).fill(entry.cards[0]) }]), 5).length, 0);
  assert.equal(parseLenormandHistory(JSON.stringify([{ ...entry, reading: '' }]), 5).length, 0);
}
for (const raw of [null, '{', '{}', '[null]', '[{}]']) assert.deepEqual(parseLenormandHistory(raw, 5), []);
console.log('PASS Lenormand history: 3/5/9/36 cards, intact saved payload/style, limits, invalid data and duplicate rejection');
