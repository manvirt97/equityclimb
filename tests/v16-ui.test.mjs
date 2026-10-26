import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const f=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const js=f('../public/ec-v16.js'),css=f('../public/ec-v16.css'),html=f('../public/index.html'),sw=f('../public/sw.js');
test('white default, personal mobile pins and preference persistence',()=>{assert.match(f('../public/app.js'),/theme: 'light'/);assert.match(html,/data-theme="light"/);assert.match(js,/function mobileNav/);assert.match(js,/function readinessView/);assert.match(js,/function canadaView/);assert.match(js,/function reportView/);assert.match(js,/localAlerts/);assert.match(js,/persist\(\)/);});
test('account sync remains functional but behind disclosure',()=>{assert.match(js,/ec16-sync-details/);assert.match(js,/Accounts & device sync/);assert.match(js,/account\.replaceWith\(wrap\)/);});
test('no fictional listing cards or demo inventory are generated',()=>{assert.doesNotMatch(js,/FICTIONAL DEMO|demoSection|demoCard|demoAnalyze/);assert.match(js,/user-entered properties only/);});
test('current resources loaded with cache upgrade',()=>{for(const x of ['ec-v16.js?v=16.1','ec-v16.css?v=16.1','ec-v16-1.js?v=16.1','ec-v16-1.css?v=16.1'])assert.ok(html.includes(x));for(const x of ['ec-v16.js','ec-v16.css','ec-v16-1.js','ec-v16-1.css'])assert.ok(sw.includes(x));assert.match(sw,/eq-v16-3-dark-back-market-tabs/);});
test('phone layout and readable print are in the stylesheet',()=>{assert.match(css,/@media\(max-width:660px\)/);assert.match(css,/@media print/);});
