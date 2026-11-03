import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');

test('free installation is connected to existing PWA release', () => {
 const html = read('index.html'), sw = read('sw.js'), version = JSON.parse(read('release.json'));
 const manifest = JSON.parse(read('manifest.webmanifest'));
 assert.equal(version.version, '16.13.0');
 assert.equal(manifest.display, 'standalone');
 assert.equal(manifest.start_url, './');
 assert.match(html, /ec-install\.js\?v=16\.13\.0/);
 assert.match(html, /ec-install\.css\?v=16\.13\.0/);
 assert.ok(html.indexOf('ec-install.js') > html.indexOf('ec-v16-11.js'));
 assert.match(sw, /'\.\/install\.html'/);
 assert.match(sw, /'\.\/ec-install\.js'/);
 assert.match(sw, /'\.\/ec-install\.css'/);
 for (const icon of manifest.icons) assert.ok(existsSync(new URL('../public/' + icon.src, import.meta.url)), icon.src);
});

test('iPhone install help preserves existing Settings and provides backup notice', () => {
 const events = {}, scheduled = [];
 const nodes = {'ec-install-hint': {textContent:''}, 'ec-install-button': {hidden:true}};
 const V = {settings: () => '<div>Original settings</div>'};
 const window = {addEventListener:(type,cb)=>events[type]=cb,matchMedia:()=>({matches:false})};
 const ctx = {V,window,navigator:{userAgent:'iPhone Safari',standalone:false,maxTouchPoints:5},
   document:{getElementById:id=>nodes[id]||null},setTimeout:cb=>scheduled.push(cb)};
 vm.runInNewContext(read('ec-install.js'),ctx);
 const html = V.settings();scheduled.forEach(cb=>cb());
 assert.match(html,/Original settings/);
 assert.match(html,/Export a backup first/);
 assert.match(nodes['ec-install-hint'].textContent,/Safari.*Share.*Add to Home Screen/);
 assert.equal(nodes['ec-install-button'].hidden,true);
 assert.doesNotMatch(read('ec-install.js'),/localStorage\.(clear|removeItem|setItem)/);
 assert.equal(typeof events.beforeinstallprompt,'function');
});

test('Android install prompt is user initiated, never auto installs', async () => {
 const events={},nodes={'ec-install-hint':{textContent:''},'ec-install-button':{hidden:true}};
 const V={settings:()=>'<div>Settings</div>'};
 const window={addEventListener:(type,cb)=>events[type]=cb,matchMedia:()=>({matches:false})};
 vm.runInNewContext(read('ec-install.js'),{
   V,window,navigator:{userAgent:'Android Chrome',standalone:false,maxTouchPoints:1},
   document:{getElementById:id=>nodes[id]||null},setTimeout:()=>{}
 });
 let prompted=0,prevented=0;
 events.beforeinstallprompt({preventDefault:()=>prevented++,prompt:async()=>{prompted++;},
   userChoice:Promise.resolve({outcome:'accepted'})});
 assert.equal(prevented,1);
 assert.equal(prompted,0);
 assert.equal(nodes['ec-install-button'].hidden,false);
 await window.ECInstall.start();
 assert.equal(prompted,1);
 events.appinstalled();
 assert.equal(nodes['ec-install-button'].hidden,true);
});

test('installation guide explains separate iOS guest storage and contains no data deletion',()=>{
 const page=read('install.html');
 assert.match(page,/Add to Home Screen/);
 assert.match(page,/Android/);
 assert.match(page,/iPhone/);
 assert.match(page,/Safari and the iPhone Home Screen app may use separate storage/);
 assert.match(page,/privacy\.html/);
 assert.doesNotMatch(page,/localStorage\.clear|indexedDB\.deleteDatabase/);
});
