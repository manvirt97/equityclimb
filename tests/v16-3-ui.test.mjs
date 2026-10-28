import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const file=n=>readFileSync(new URL('../public/'+n,import.meta.url),'utf8');
const js=file('ec-v16-3.js'),css=file('ec-v16-3.css'),html=file('index.html'),sw=file('sw.js');
test('16.3 mobile nav defaults to Markets instead of Goals, but individual pins are configurable',()=>{
 assert.match(file('ec-v16.js'),/st\.pins=\['budget','homes','advisor','market'\]/);
 assert.match(js,/OLD_DEFAULT=\['budget','homes','advisor','goals'\]/);
 assert.match(js,/state\.pins=\[\.\.\.DEFAULT_PINS\]/);
 assert.match(js,/EC163=\{back,resetNav/);
 assert.match(file('ec-v16.js'),/pin\(i,id\)/);
});
test('Back uses a route stack and does not re-push restored pages',()=>{
 assert.match(js,/stack\.push\(/);assert.match(js,/stack\.pop\(\)/);
 assert.match(js,/originalGo\.call\(/);assert.match(js,/aria-label/);
});
test('market learn note svg receives explicit compact dimensions',()=>{
 assert.match(css,/#mk-brief \.note>svg/);assert.match(css,/max-height:17px!important/);
 assert.match(css,/#mk-brief \.note\{height:auto!important/);
});
test('fixed-white v16.1 surfaces have dark theme-specific overrides',()=>{
 for(const selector of ['ec161-three-metrics','ec161-settings-hero','ec161-feed-intro','ec161-smart-move','ec161-no-feed'])assert.ok(css.includes(selector));
 assert.match(css,/html\[data-theme="dark"\]/);
});
test('cache bumps and styles/scripts are included after older versions',()=>{
 assert.ok(html.includes('ec-v16-3.css?v=16.3'));
 assert.ok(html.includes('ec-v16-3.js?v=16.3'));
 assert.match(sw,/eq-v16-7-prime-announcement/);
 assert.ok(sw.includes('ec-v16-3.css'));assert.ok(sw.includes('ec-v16-3.js'));
});
