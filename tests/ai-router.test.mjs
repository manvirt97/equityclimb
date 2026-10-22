import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalogue,selectSlot,classify } from '../functions/_shared/ai-registry.js';
import { reserveBudget,onRequestPost } from '../functions/api/ai-router.js';
import {validateAuthorizedListing} from '../functions/_shared/property-schema.js';
import {onRequestGet as homes} from '../functions/api/homes.js';

test('default AI catalog is free-only; paid providers are disabled',()=>{
 const j=readCatalogue({AI:{run(){}}});
 assert.equal(j.slots.filter(x=>x.available).length,4);
 assert.equal(j.slots.filter(x=>x.paid&&x.available).length,0);
 assert.match(selectSlot({AI:{}},'claude:advanced','Explain mortgage').error,/not configured/);
 assert.equal(classify('What is compound interest?'),'free:fast');
 assert.equal(classify('Compare mortgage offers and taxes'),'free:deep');
});
test('paid AI requires owner opt-in, key and explicit model ID',()=>{
 const env={AI:{},ENABLE_PAID_AI:'on',OPENAI_API_KEY:'secret',OPENAI_MODEL_FAST:'gpt-valid'};
 assert.equal(selectSlot(env,'openai:fast','test').model,'gpt-valid');
 assert.ok(selectSlot(env,'claude:fast','test').error);
 assert.ok(selectSlot({...env,ENABLE_PAID_AI:'off'},'openai:fast','test').error);
 assert.equal(selectSlot(env,'auto','What is budgeting?').provider,'free');
});
test('AI route refuses unmetered usage when D1 binding is missing',async()=>{
 const request=new Request('https://equityclimb.test/api/ai-router',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:'auto',messages:[{role:'user',content:'Explain RRSP'}]})});
 const result=await onRequestPost({request,env:{AI:{}}});
 assert.equal(result.status,429);
 assert.equal((await result.json()).code,'limit');
});
test('budget enforces a daily limit atomically for a client',async()=>{
 let count=0;
 const db={prepare(sql){return {async run(){return {meta:{changes:1}}},bind(...x){return {async run(){if(count>=2)return {meta:{changes:0}};count++;return {meta:{changes:1}}}}}}}};
 const req=new Request('https://equityclimb.test/api/ai-router',{headers:{'CF-Connecting-IP':'192.0.2.100'}});
 const env={DB:db,AI_DAILY_LIMIT:'2'};
 assert.equal((await reserveBudget(env,req)).ok,true);
 assert.equal((await reserveBudget(env,req)).ok,true);
 assert.equal((await reserveBudget(env,req)).ok,false);
});
test('only records with declared display rights are permitted in a source-neutral listing schema',()=>{
 const x={source:'authorized',sourceId:'id-1',price:400000,address:'Secret address',lat:51,lng:-114,images:['https://photos.example/x.jpg','http://bad.test/x.jpg'],notes:'Never expose'};
 assert.equal(validateAuthorizedListing(x,null).ok,false);
 const y=validateAuthorizedListing(x,{authorized:true,contractId:'test-agreement',addressVisible:false,allowedFields:['source','sourceId','price','address','lat','lng','images']});
 assert.equal(y.ok,true);
 assert.equal(y.item.address,'Address withheld by listing agent');
 assert.equal(y.item.lat,null);
 assert.ok(!JSON.stringify(y.item).includes('Never expose'));
 assert.deepEqual(y.item.images,['https://photos.example/x.jpg']);
});
test('homes sources endpoint never claims DDF is connected',async()=>{
 const r=await homes({request:new Request('https://equityclimb.test/api/homes?mode=sources'),env:{}});
 const j=await r.json();assert.equal(j.feeds.length,3);assert.equal(j.feeds[1].connected,false);
});
test('free Auto routing can fall back to the free balanced model without invoking a paid API',async()=>{
 const called=[];
 const db={ prepare(){return {run:async()=>({meta:{changes:1}}),bind:()=>({run:async()=>({meta:{changes:1}})})};} };
 const env={AI:{async run(model){called.push(model);if(model.includes('gpt-oss'))throw Error('unavailable');return {response:'A simple answer.\nFOLLOWUPS: What next? | What could change? | Why?'};}},DB:db};
 const request=new Request('https://equityclimb.test/api/ai-router',{method:'POST',headers:{'content-type':'application/json','CF-Connecting-IP':'192.0.2.200'},body:JSON.stringify({model:'auto',messages:[{role:'user',content:'Compare my mortgage options and taxes in Canada.'}]})});
 const res=await onRequestPost({request,env});const j=await res.json();
 assert.equal(res.status,200);assert.equal(j.fallback,true);assert.equal(j.model,'free:balanced');
 assert.equal(called.length,2);assert.match(j.text,/simple answer/);
});
