import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const js=read('ec-v16-5.js'),css=read('ec-v16-5.css'),html=read('index.html'),sw=read('sw.js');
const sample=()=>({id:'manual-1',manual:true,address:'Private Street Address',city:'Calgary',price:600000,sourceUrl:'https://www.realtor.ca/'});
function setup(){
 const actions=[],home=sample(),S={profile:{onboarded:true,city:'Calgary'},cash:180000,budget:{essentials:{housing:800}},
    ec13:{calc:{down:120000,rate:5,years:25},homes:{saved:[home,{id:'provider-2',manual:false,price:200000}]}},
    ec165:{},ec16:{}};
 const window={ECMoney:{ownership:({price,down,rate})=>({
   price,total:price/300+(rate-5)*200,upfront:down+price*.015,minimumDown:price*.05,
   downPaymentValid:down>=price*.05,insuranceNeedsReview:false})},
   ECModel:()=>({income:8000,essentials:1700,lifestyle:600,debt:500,savings:900}),
   EC7:{prefill:q=>actions.push(['prefill',q])},EC13:{tab:k=>actions.push(['tab',k]),analyze:(mode,i)=>actions.push(['analyze',mode,i])}};
 let saves=0,renders=0;
 const V={home:()=>'',homes:()=>''};
 const context={window,S,V,document:{getElementById:()=>null},Intl,console,
   save:()=>saves++,render:()=>renders++,go:k=>actions.push(['go',k]),navigator:{},globalThis:null};
 vm.runInNewContext(js,context);
 return {S,V,home,api:window.EC165,actions,stats:()=>({saves,renders})};
}
test('Home/dashboard renderer stays exactly as it was before the shortlist module loads',()=>{
 const {V}=setup();
 // The base Home here is an empty stub; if the module overrides Home at all, identity changes.
 assert.equal(V.home.toString(),'()=>\'\'');
 assert.doesNotMatch(js,/V\.home\s*=/);
 assert.doesNotMatch(js,/function nextMove\(/);
 assert.doesNotMatch(css,/\.ec165-brief\{/);
 assert.doesNotMatch(css,/\.ec165-brief-cta/);
});

test('installed PWA loads only the new decision module, with updated cache',()=>{
 assert.ok(html.includes('ec-v16-5.js?v=16.5'));
 assert.ok(html.includes('ec-v16-5.css?v=16.5'));
 assert.ok(html.indexOf('ec-v16-3.js')<html.indexOf('ec-v16-5.js'));
 assert.ok(sw.includes('eq-v16-5-decision-journey'));
 for(const name of ['ec-v16-5.js','ec-v16-5.css'])assert.ok(sw.includes(name));
});
test('owner-entered properties only; existing licensed-feed IDs are not reused',()=>{
 const {S,api}=setup();
 assert.equal(api.evaluate(0).price,600000);
 assert.equal(api.evaluate(1),null);
 assert.equal(S.ec13.homes.saved.length,2);
});
test('property costs reuse saved mortgage assumptions, without mutating the calculator',()=>{
 const {S,api}=setup();
 const base=api.evaluate(0,0),higher=api.evaluate(0,2);
 assert.equal(base.estimate.total,2000);
 assert.equal(higher.estimate.total,2400);
 assert.equal(base.estimate.upfront,129000);
 assert.equal(S.ec13.calc.rate,5);
 assert.equal(S.ec13.calc.down,120000);
});
test('when real income and cash figures allow it, result is explicitly conditional',()=>{
 const {api}=setup();const x=api.evaluate(0);
 assert.equal(x.code,'possible');assert.match(x.reason,/not a mortgage qualification/);
});
test('cash shortfall, insufficient down and monthly overage are recognized',()=>{
 const {S,api}=setup();
 S.cash=10000;
 assert.equal(api.evaluate(0).title,'Upfront cash gap');
 S.ec13.calc.down=10000;
 assert.equal(api.evaluate(0).title,'Down payment needs review');
 S.ec13.calc.down=120000;
 S.cash=180000;S.ec13.calc.rate=25;
 assert.equal(api.evaluate(0).title,'Above planned monthly room');
});
test('new buying stages, notes and preferences persist independently of existing shortlist',()=>{
 const {S,api,stats}=setup();
 api.stage(0,'visited');
 api.note(0,'Roof condition needs checking');
 api.focus(0);api.shock('2');api.filter('visited');api.sort('price');
 assert.equal(S.ec165.stages['manual-1'],'visited');
 assert.equal(S.ec165.notes['manual-1'],'Roof condition needs checking');
 assert.equal(S.ec165.focus,'manual-1');
 assert.equal(S.ec165.rateShock,2);
 assert.equal(S.ec165.filter,'visited');
 assert.equal(S.ec165.sort,'price');
 assert.equal(S.ec13.homes.saved[0].address,'Private Street Address');
 assert.equal(stats().saves,6);
 assert.equal(stats().renders,5);
});
test('unrecognized user controls cannot set arbitrary stages or rate shocks',()=>{
 const {S,api}=setup();
 api.stage(0,'invented');api.shock('9');api.filter('bad');api.sort('bad');
 assert.equal(S.ec165.stages['manual-1'],undefined);
 assert.equal(S.ec165.rateShock,0);
 assert.equal(S.ec165.filter,'all');
 assert.equal(S.ec165.sort,'recent');
});
test('Copilot handoff drafts decision context without the private street or notes',()=>{
 const {api,actions}=setup();
 api.ask(0);
 const q=actions[0][1];
 assert.equal(actions[0][0],'prefill');
 assert.match(q,/600,000/);
 assert.match(q,/lender and inspector/);
 assert.ok(!q.includes('Private Street Address'));
 assert.match(js,/Prefill only/);
});
test('existing Decision Lab and Saved navigation are retained',()=>{
 const {api,actions}=setup();
 api.analyze(0);api.open('saved');api.open('budget');
 assert.deepEqual(actions.map(x=>x[0]),['analyze','tab','go']);
 assert.equal(actions[0][1],'saved');
});
test('uses theme tokens and exposes accessible responsive controls',()=>{
 for(const token of ['var(--surface)','var(--ink)','var(--accent)','var(--line)'])assert.ok(css.includes(token));
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(js,/aria-label="Your home decision board"/);
 assert.match(js,/role="status"/);
});
test('no unauthorized MLS data or fake price-change alerts are introduced',()=>{
 assert.doesNotMatch(js,/fetch\(['"]?\/api\/homes/);
 assert.match(js,/NEVER fetches, fabricates or caches/);
 assert.match(js,/MLS price or status changes are not monitored/);
});
