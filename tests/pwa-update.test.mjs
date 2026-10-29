import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=n=>readFileSync(new URL('../public/'+n,import.meta.url),'utf8');
const updater=read('ec-pwa-update.js'),sw=read('sw.js'),index=read('index.html'),headers=read('_headers'),release=JSON.parse(read('release.json'));
test('iPhone updater is bootstrapped ahead of the app and installs network revalidation',()=>{
 assert.ok(index.indexOf('ec-pwa-update.js?v=16.9.0')<index.indexOf('app.js?v=16.9'));
 assert.match(read('app.js'),/serviceWorker\.register\('sw\.js',\{updateViaCache:'none'\}\)/);
 assert.match(updater,/navSW\.register\(SW,\{updateViaCache:'none'\}\)/);
 assert.match(updater,/addEventListener\('visibilitychange'/);
 assert.match(updater,/addEventListener\('pageshow'/);
 assert.match(updater,/addEventListener\('online'/);
});
test('PWA install must have a working shell; updates do not clear localStorage or account data',()=>{
 assert.equal(release.version,'16.9.0');
 assert.match(sw,/await cache\.add\(new Request\('\.\/index\.html',\{cache:'no-store'\}\)\)/);
 assert.match(sw,/name\.startsWith\('eq-'\)/);
 assert.doesNotMatch(updater+sw,/localStorage\.(clear|removeItem)|indexedDB\.deleteDatabase/);
 assert.doesNotMatch(updater+sw,/caches\.keys\(\).*caches\.delete\(x\)/);
 assert.match(sw,/client\.postMessage\(\{type:'EQUITYCLIMB_UPDATED'/);
 assert.match(sw,/new Request\(event\.request,\{cache:'no-store'\}\)/);
 assert.match(headers,/\/index\.html[\s\S]*?Cache-Control: no-cache/);
 assert.match(headers,/\/release\.json\s+Cache-Control: no-store/);
});
test('phone update prompt can refresh the page without deleting or renaming saved user data',async()=>{
 const found=new Map(),events={},swEvents={};
 const element=(tag='div')=>({
   tag,children:[],listeners:{},_text:'',setAttribute(){},
   append(...nodes){this.children.push(...nodes);for(const n of nodes)if(n.id)found.set(n.id,n);},
   addEventListener(name,cb){this.listeners[name]=cb;},
   remove(){found.delete(this.id);},
   set textContent(v){this._text=v;this.children=[];},get textContent(){return this._text;}
 });
 const body=element('body');
 const document={
   body,documentElement:element('html'),
   activeElement:{matches:()=>false},
   createElement:element,getElementById:id=>found.get(id)||null,
   addEventListener(name,cb){events[name]=cb;},hidden:false
 };
 const swClient={controller:{},listeners:swEvents,
   addEventListener(name,cb){swEvents[name]=cb;},
   register:async()=>({update:async()=>{}}),
   getRegistration:async()=>({update:async()=>{}})
 };
 const replaced=[],fetched=[],writes=[];
 const location={href:'https://equityclimb.pages.dev/#market',
   replace:url=>replaced.push(url)};
 const window={setInterval:()=>{},addEventListener(name,cb){events[name]=cb;}};
 const storage={setItem:(k,v)=>writes.push([k,v]),getItem:()=>null};
 vm.runInNewContext(updater,{window,document,navigator:{serviceWorker:swClient,onLine:true},location,
    sessionStorage:storage,fetch:async url=>{fetched.push(url);return {ok:true,json:async()=>({version:'16.10.0'})};},
    URL,Date,Error,Number,String,Math,Promise,console});
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(fetched.some(s=>s.includes('/release.json')));
 assert.ok(found.has('ec-update-notice'));
 const notice=found.get('ec-update-notice');
 assert.match(notice.children[0].textContent,/without deleting your app/);
 assert.equal(replaced.length,0,'financial inputs must not disappear via unsolicited reload');
 notice.children[1].listeners.click();
 assert.equal(replaced.length,1);
 assert.match(replaced[0],/ec_build=16\.10\.0/);
 assert.match(replaced[0],/#market$/);
 assert.deepEqual(writes.map(([k])=>k),['ec_update_requested']);
});
test('PWA version checks do not modify the existing Home or Shortlist renderers',()=>{
 assert.doesNotMatch(updater,/V\.home\s*=|V\.homes\s*=/);
 assert.match(read('ec-v16-5.js'),/ONLY|Only the Real Estate shortlist|shortlist is enhanced/i);
 assert.ok(index.includes('ec-v16-5.js?v=16.5'));
 assert.match(read('ec-pwa-update.css'),/safe-area-inset-bottom/);
});
