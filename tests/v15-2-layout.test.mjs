import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const path=u=>readFileSync(new URL(u,import.meta.url),'utf8');
const js=path('../public/ec-v15-2.js'), css=path('../public/ec-v15-2.css'), html=path('../public/index.html');
test('homes dashboard gets existing finance cards ahead of new guidance',()=>{
 assert.match(js,/querySelector\('\.ec15-home-path'\)/);
 assert.match(js,/querySelector\('\.ec13-home-start'\)/);
 assert.match(js,/querySelector\('\.foot'\)/);
 assert.match(js,/parent\.insertBefore\(banner, footer\)/);
 assert.match(js,/parent\.insertBefore\(actions, footer\)/);
});
test('mobile header uses iOS notch safe inset and script loads after old code',()=>{
 assert.match(css,/safe-area-inset-top/);
 assert.ok(html.indexOf('ec-v15.js?v=15.2')<html.indexOf('ec-v15-2.js?v=15.2'));
});
test('model picker groups providers and filters unconnected options',()=>{
 assert.match(js,/OpenAI API · separately billed/);
 assert.match(js,/Anthropic Claude API · separately billed/);
 assert.match(js,/filter\(s=>s\?\.available\)/);
 assert.match(js,/ec152-provider-details/);
});
