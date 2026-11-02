import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../public/' + p, import.meta.url), 'utf8');
const js = read('ec-v16-11.js');
const css = read('ec-v16-11.css');
const html = read('index.html');
const sw = read('sw.js');

test('four cards are fed by the existing rate objects, not hard-coded values', () => {
  for (const key of ["rates.prime", "rates.policy", "rates.bond5", "rates.fiveYearPosted"]) {
    assert.ok(js.includes(key), key + ' rate source must remain dynamic');
  }
  for (const title of ['Bank prime', 'BoC policy', '5-year bond', '5-year posted']) {
    assert.ok(js.includes(title), title + ' card should exist');
  }
  assert.match(js, /valueOf\(item\.rate\)/);
  assert.doesNotMatch(js, /4\.70%|2\.50%|3\.51%|6\.19%/);
  assert.match(js, /Unavailable/);
  assert.match(js, /Older observation/);
});

test('source attribution is per card and external links are restricted', () => {
  assert.match(js, /verifiedSource/);
  assert.match(js, /url\.protocol !== 'https:'/);
  assert.match(js, /rel="noopener noreferrer"/);
  assert.match(js, /aria-label="View official source for/);
  assert.match(js, /item\.date/);
  assert.match(js, /item\.source/);
});

test('rates are moved immediately after the financial KPIs without changing saved state', () => {
  assert.match(js, /\.ec153-primary-metrics/);
  assert.match(js, /Rates and market/);
  assert.match(js, /snapshot\.after\(heading, market/);
  assert.match(js, /previousHome\.apply\(this, args\)/);
  assert.doesNotMatch(js, /localStorage\.(setItem|removeItem|clear)|S\.rate\s*=|S\.home\s*=/);
});

test('rates fill four real columns, adapt to tablets/phones, and ship in the PWA', () => {
  assert.match(css, /\.grid\.ec8-rates\.ec1611-rates\s*\{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 1040px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /focus-visible/);
  assert.ok(html.includes('ec-v16-11.css?v=16.11.0'));
  assert.ok(html.includes('ec-v16-11.js?v=16.11.0'));
  assert.ok(html.indexOf('ec-v16-11.js') > html.indexOf('ec-v16-5.js'));
  for (const file of ['ec-v16-11.css', 'ec-v16-11.js']) assert.ok(sw.includes(file));
});
