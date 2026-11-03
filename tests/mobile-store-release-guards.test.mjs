import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { onRequestPost as legacyAI } from '../functions/api/ai.js';
import { onRequestPost as modelAI } from '../functions/api/ai-chat.js';

// Guard against regressions that reintroduce unmetered public Workers AI calls.
const routes = [
  ['legacy AI', legacyAI, { mode: 'chat', messages: [{ role: 'user', content: 'What is compound interest?' }] }],
  ['model AI', modelAI, { model: 'balanced', messages: [{ role: 'user', content: 'What is compound interest?' }] }]
];
for (const [label, handle, body] of routes) {
  test(label + ': never invoke AI without a configured rate-limit database', async () => {
    let called = false;
    const env = { AI: { run: async () => { called = true; return { response: 'unsafe' }; } } };
    const request = new Request('https://equityclimb.test/api/ai', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    const response = await handle({ request, env });
    assert.equal(response.status, 429);
    assert.equal(called, false);
    const result = await response.json();
    assert.equal(result.code, 'limit');
  });
  test(label + ': reject non-JSON requests before AI execution', async () => {
    const env = { AI: { run: () => { throw Error('AI should not run'); } } };
    const request = new Request('https://equityclimb.test/api/ai', {
      method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'not json'
    });
    const response = await handle({ request, env });
    assert.equal(response.status, 415);
  });
}
test('live app entry point never references missing local scripts or style sheets', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+\.(?:js|css)(?:\?[^\"]*)?)"/g)) {
    const path = match[1].split('?')[0];
    assert.ok(existsSync(new URL('../public/' + path, import.meta.url)), 'missing application asset: ' + path);
  }
});
test('public AI endpoints never expose raw provider exceptions in responses', () => {
  for (const path of ['../functions/api/ai.js', '../functions/api/ai-chat.js']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /detail:\s*s\.slice\(0,\s*200\)/);
  }
});
