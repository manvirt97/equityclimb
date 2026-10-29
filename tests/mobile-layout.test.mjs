import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css14 = readFileSync(new URL('../public/ec-v14.css', import.meta.url), 'utf8');
const css15 = readFileSync(new URL('../public/ec-v15.css', import.meta.url), 'utf8');
const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

test('desktop navigation stylesheet does not force sidebar visible across phone breakpoint', () => {
  assert.doesNotMatch(css14, /\.side\s*\{\s*display\s*:\s*flex\s*;/);
  assert.match(css15, /@media\s*\(max-width\s*:\s*920px\)/);
  assert.match(css15, /#side\.side\s*\{\s*display\s*:\s*none\s*!important/);
});

test('bottom navigation is present and visible for phone widths', () => {
  assert.match(index, /<nav class="tabbar" id="tabbar"><\/nav>/);
  assert.match(css15, /#tabbar\.tabbar\s*\{\s*display\s*:\s*flex/);
  assert.match(css15, /#view\s*\{\s*display\s*:\s*block/);
});

test('mobile shortcuts do not obscure app content and cache gets a fresh version', () => {
  assert.match(css15, /#ec8-ask,\.ec-news-key-button\s*\{\s*display\s*:\s*none\s*!important/);
  assert.match(index, /ec-v15-2\.css\?v=15\.2/);
  assert.match(sw, /eq-v16-10-finance-audit/);
});
