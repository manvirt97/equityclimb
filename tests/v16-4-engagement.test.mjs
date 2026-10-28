import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const file=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const js=file('ec-v16-4.js'),css=file('ec-v16-4.css'),html=file('index.html'),sw=file('sw.js');
function harness(){
 const calls=[],state={profile:{onboarded:true,city:'Calgary'},ec16:{targetPrice:600000},ec13:{homes:{saved:[]},calc:{down:60000,rate:4.5,years:25}}};
 const window={ECMoney:{ownership:({price})=>({total:price/400,upfront:price*.1,minimumDown:price*.05,downPaymentValid:true})},EC13:{tab:k=>calls.push(k)}};
 const env={window,S:state,V:{home:()=>'',homes:()=>''},ECMoney:window.ECMoney,save:()=>calls.push('save'),document:{getElementById:()=>null},console,Intl,render:()=>calls.push('render'),go:k=>calls.push(k)};
 vm.runInNewContext(js,env);
 return {api:window.EC164,state,calls};
}
test('v16.4 assets load after stable app and update PWA cache',()=>{
 assert.ok(html.includes('ec-v16-4.css?v=16.4'));
 assert.ok(html.includes('ec-v16-4.js?v=16.4'));
 assert.ok(html.indexOf('ec-v16-3.js')<html.indexOf('ec-v16-4.js'));
 assert.match(sw,/eq-v16-4-discovery-studio/);
 assert.ok(sw.includes("'./ec-v16-4.js'"));
 assert.ok(sw.includes("'./ec-v16-4.css'"));
});
test('saved search plans are distinct from the user owned property shortlist',()=>{
 const {api,state}=harness();
 api.field('city','Toronto');api.field('price',700000);api.field('beds','3');api.field('type','detached');
 api.savePlan();
 assert.equal(state.ec16.discoveryPlans.length,1);
 assert.equal(state.ec16.discoveryPlans[0].city,'Toronto');
 assert.equal(state.ec16.discoveryPlans[0].price,700000);
 assert.equal(state.ec16.discoveryPlans[0].beds,'3');
 assert.equal(state.ec16.discoveryPlans[0].type,'detached');
 assert.equal(state.ec13.homes.saved.length,0);
 api.savePlan();assert.equal(state.ec16.discoveryPlans.length,1);
});
test('capped plans do not erase existing financial or shortlist data',()=>{
 const {api,state}=harness();
 state.profile.name='Existing user';
 state.ec13.homes.saved=[{id:'home1',manual:true,address:'User property'}];
 for(let i=0;i<9;i++){api.price(400000+i*10000);api.savePlan();}
 assert.equal(state.ec16.discoveryPlans.length,6);
 assert.equal(state.profile.name,'Existing user');
 assert.equal(state.ec13.homes.saved.length,1);
 api.remove(0);
 assert.equal(state.ec16.discoveryPlans.length,5);
 assert.equal(state.ec13.homes.saved[0].id,'home1');
});
test('existing discover and saved tabs remain the destination',()=>{
 const {api,calls}=harness();
 api.resume();api.shortlist();
 assert.deepEqual(calls,['discover','saved']);
});
test('search inputs are constrained before saving',()=>{
 const {api,state}=harness();
 api.field('price','-500');assert.equal(state.ec16.discoveryDraft.price,0);
 api.field('price','500000000000');assert.equal(state.ec16.discoveryDraft.price,20000000);
 api.field('type','unknown');assert.equal(state.ec16.discoveryDraft.type,'any');
 api.field('beds','8');assert.equal(state.ec16.discoveryDraft.beds,'any');
});
test('provider handoff and financial preview are truthful',()=>{
 assert.match(js,/https:\/\/www\.realtor\.ca\//);
 assert.match(js,/https:\/\/www\.zolo\.ca\//);
 assert.match(js,/Apply the filters there/);
 assert.match(js,/does not receive live listings or send new-listing alerts/);
 assert.match(js,/ECMoney\.ownership/);
 assert.match(js,/ec161-no-feed/);
});
test('responsive themed styles and accessibility controls exist',()=>{
 assert.match(css,/var\(--surface\)/);
 assert.match(css,/var\(--ink\)/);
 assert.match(css,/@media\(max-width:660px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(js,/aria-live="polite"/);
});
