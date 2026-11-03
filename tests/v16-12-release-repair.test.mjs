import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../public/' + file, import.meta.url), 'utf8');

test('Home market enhancement boots when V is a top-level lexical binding, not window.V', () => {
  const home = () => '<div class="original-home">Original Home</div>';
  const oldRateStrip = () => '<div class="existing-rates"></div>';
  const V = { home };
  const window = { rateStrip: oldRateStrip };
  // The real app defines "const V" at the top level. There is no window.V.
  assert.equal(window.V, undefined);
  vm.runInNewContext(read('ec-v16-11.js'), {
    window, V, S: { profile: { onboarded: false } }, console, Date,
    Intl, URL, Number, String, Math
  });
  assert.equal(window.__ec1611, true, 'the enhancement must initialize');
  assert.notEqual(V.home, home, 'the Home layout must receive the enhancement');
  assert.notEqual(window.rateStrip, oldRateStrip, 'the rate cards must receive the enhancement');
});

test('PWA release and updater versions agree across source, page and worker', () => {
  const index = read('index.html');
  const updater = read('ec-pwa-update.js');
  const release = JSON.parse(read('release.json'));
  const sw = read('sw.js');
  const match = updater.match(/const BUILD='([^']+)'/);
  assert.ok(match, 'updater has a declared build');
  assert.equal(match[1], release.version);
  assert.ok(index.includes('ec-pwa-update.js?v=' + release.version));
  assert.ok(index.includes('ec-install.js?v=' + release.version));
  assert.match(sw, /eq-v16-13-install-ready/);
  assert.ok(sw.includes("version:'" + release.version + "'"));
});

test('PWA never prompts again for the already-installed build or a late old-worker message', async () => {
  const elements = new Map();
  const events = {}, swEvents = {}, navigations = [], writes = [];
  const make = tag => ({
    tag, children: [], listeners: {}, textContent: '', id: '',
    setAttribute() {}, append(...children) {
      this.children.push(...children);
      for (const child of children) if (child.id) elements.set(child.id, child);
    },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    remove() { elements.delete(this.id); }
  });
  const document = {
    body: make('body'), documentElement: make('html'),
    activeElement: { matches: () => false }, hidden: false,
    createElement: make, getElementById: id => elements.get(id) || null,
    addEventListener(name, fn) { events[name] = fn; }
  };
  const serviceWorker = {
    controller: {},
    addEventListener(name, fn) { swEvents[name] = fn; },
    register: async () => ({ update: async () => {} }),
    getRegistration: async () => ({ update: async () => {} })
  };
  const location = { href: 'https://equityclimb.pages.dev/#home', replace: url => navigations.push(url) };
  const window = { addEventListener(name, fn) { events[name] = fn; }, setInterval() {} };
  let serverVersion = '16.13.0';
  vm.runInNewContext(read('ec-pwa-update.js'), {
    window, location, document, navigator: { serviceWorker, onLine: true },
    sessionStorage: { setItem: (k,v) => writes.push([k,v]) },
    fetch: async () => ({ ok: true, json: async () => ({ version: serverVersion }) }),
    URL, Date, Promise, Error, String, Number, Math, console
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.has('ec-update-notice'), false, 'current build must not request another reload');
  swEvents.message({ data: { type: 'EQUITYCLIMB_UPDATED', version: '16.11.0' } });
  assert.equal(elements.has('ec-update-notice'), false, 'an older worker must not request a reload');
  swEvents.controllerchange();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.has('ec-update-notice'), false, 'controller switch to same build is not an update');
  assert.equal(navigations.length, 0, 'no automatic navigation');
  assert.equal(writes.length, 0, 'no unapproved storage changes');
  serverVersion = '16.14.0';
  await window.ECPWA.check();
  assert.equal(elements.has('ec-update-notice'), true, 'a truly newer version should still be offered');
});
