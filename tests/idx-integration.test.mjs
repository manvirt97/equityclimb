import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync('public/ec-idx.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');

function run(source, hostname='equityclimb.pages.dev') {
  const window = {};
  const V = { homes: () => '<section class="card ec13-search">Keep original search</section>' };
  const context = {window, V, location:{hostname}, URL};
  vm.runInNewContext(source,context);
  return {window,V};
}

test('IDX adapter remains fail-closed until authorized and leaves existing controls unchanged', () => {
  const {window,V} = run(script);
  assert.equal(window.ECIdx.isConnected(),false);
  assert.equal(V.homes(),'<section class="card ec13-search">Keep original search</section>');
  assert.match(script,/enabled:\s*false/);
  assert.doesNotMatch(script,/fetch\(.*realtor\.ca|api\.realtor\.ca/i);
});

test('an approved https provider frame appears only on its explicitly approved domain', () => {
  const live = script.replace('enabled: false','enabled: true')
    .replace("approvedHost: ''", "approvedHost: 'equityclimb.pages.dev'")
    .replace("iframeUrl: ''", "iframeUrl: 'https://site.realtyninja.com/approved-demo-frame'");
  const valid=run(live);
  assert.equal(valid.window.ECIdx.isConnected(),true);
  assert.match(valid.V.homes(),/class="ecidx-frame"/);
  assert.match(valid.V.homes(),/Keep original search/);
  const other=run(live,'unauthorized.example');
  assert.equal(other.window.ECIdx.isConnected(),false);
  assert.doesNotMatch(other.V.homes(),/ecidx-frame/);
});

test('the adapter rejects unsupported and unsafe embed origins',()=>{
  for (const url of ['http://site.realtyninja.com/frame','https://evil.example/frame',
    'https://realtyninja.com.evil.example/frame','javascript:alert(1)']) {
    const live=script.replace('enabled: false','enabled: true')
      .replace("approvedHost: ''", "approvedHost: 'equityclimb.pages.dev'")
      .replace("iframeUrl: ''", "iframeUrl: '"+url+"'");
    assert.equal(run(live).window.ECIdx.isConnected(),false);
  }
});

test('IDX resources load after the existing Real Estate presentation and without altering source feed',()=>{
  assert.match(index,/ec-idx\.css/);
  assert.match(index,/ec-idx\.js/);
  assert.ok(index.indexOf('ec-v16-11.js') < index.indexOf('ec-idx.js'));
  assert.match(script,/previous\.apply\(this, args\)/);
  assert.match(script,/sandbox="allow-scripts/);
});
