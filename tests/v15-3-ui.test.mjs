import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const f=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const js=f('../public/ec-v15-3.js'),css=f('../public/ec-v15-3.css'),html=f('../public/index.html'),sw=f('../public/sw.js');
test('Real Estate retains #homes route and changes only its display label',()=>{
 assert.match(js,/row\?\.\[0\] === 'homes'/);
 assert.match(js,/row\[1\] = 'Real Estate'/);
 assert.match(js,/Navigation keeps the existing #homes route/);
 assert.match(js,/window\.EC_NAV/);
});
test('Home organizes KPIs, market and detail panels without recalculating values',()=>{
 assert.match(js,/querySelector\('\.grid\.g4:not\(\.mini\)'\)/);
 assert.match(js,/querySelector\('\.grid\.g4\.mini'\)/);
 assert.match(js,/querySelector\('\.grid\.g21'\)/);
 assert.match(js,/market\.after\(extra\)/);
 assert.match(js,/next\.append\(two\)/);
 assert.match(js,/footer\.before\(next\)/);
 assert.match(css,/\.ec153-next-grid/);
});
test('New resources are included in build and cache',()=>{
 for(const s of ['ec-v15-3.js?v=15.3','ec-v15-3.css?v=15.3'])assert.ok(html.includes(s));
 assert.match(sw,/eq-v16-3-dark-back-market-tabs/);
});
