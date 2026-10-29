import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectPublicFeeds} from '../scripts/audit-public-data.mjs';
import {onRequestGet as rulesGet} from '../functions/api/rules.js';
import {onRequestGet as quotesGet} from '../functions/api/quotes.js';
import {onRequestGet as newsGet} from '../functions/api/news.js';
const read=x=>readFileSync(new URL('../public/'+x,import.meta.url),'utf8');

test('unsupported tax years cannot silently return the wrong year',async()=>{
 const old=await rulesGet({request:new Request('https://app.local/api/rules?year=2025')});
 const newer=await rulesGet({request:new Request('https://app.local/api/rules?year=2035')});
 const invalid=await rulesGet({request:new Request('https://app.local/api/rules?year=ABC')});
 for(const x of [old,newer,invalid])assert.equal(x.status,400);
 const exact=await rulesGet({request:new Request('https://app.local/api/rules?year=2026')});
 const j=await exact.json();
 assert.equal(exact.status,200);
 assert.equal(j.year,2026);assert.equal(j.status,'official_with_estimates');
 assert.equal(j.table.federal.brackets[0].upTo,58523);
 assert.equal(j.table.provinces.AB.brackets[0].upTo,61200);
 assert.equal(j.table.cpp.ympe,74600);assert.equal(j.table.cpp.yampe,85000);
 assert.equal(j.table.ei.mie,68900);
 assert.equal(j.limits.tfsa,7000);assert.equal(j.limits.rrsp,33810);
});
test('conservative mortgage cost never understates an ineligible insured scenario',async()=>{
 await import('../public/ec-money-core.js');
 const C=globalThis.ECMoney;
 for(const x of [
   C.ownership({price:600000,down:10000,rate:5,years:25}),
   C.ownership({price:500000,down:50000,rate:5,years:30,eligible30:false}),
   C.ownership({price:1550000,down:200000,rate:5,years:25})
 ]){
  assert.equal(x.insuranceNeedsReview,true);
  assert.ok(x.insurancePremium>0,'do not drop insurance allowance on an ineligible loan');
  assert.ok(x.principal>x.price-x.down);
  assert.match(x.caution,/NOT qualify/);
  assert.equal(x.insuranceEstimateAvailable,false);
 }
 const good=C.ownership({price:600000,down:120000,rate:5,years:25});
 assert.equal(good.insurancePremium,0);
});
test('quote feed exposes provider and a real per-quote trade timestamp, not fetch timestamp',async()=>{
 const old=globalThis.fetch,caches0=globalThis.caches;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 const ts=Math.floor(Date.now()/1000)-7200;
 globalThis.fetch=async u=>new Response(JSON.stringify({chart:{result:[{meta:{regularMarketPrice:200,previousClose:199,currency:'CAD',exchangeName:'TOR',shortName:'RBC',regularMarketTime:ts},indicators:{quote:[{close:[190,199,200]}]}}]}}),{status:200});
 try{
  const reply=await quotesGet({request:new Request('https://app.local/api/quotes?symbols=RY.TO&fresh=1'),waitUntil:()=>{}});
  const result=await reply.json();const item=result.items[0];
  assert.equal(item.provider,'Yahoo Finance');
  assert.equal(item.value,200);
  assert.equal(item.time,ts*1000);
  assert.equal(item.timestampVerified,true);
  assert.equal(item.delayed,true);
  assert.equal(result.fetched>item.time,true);
 }finally{globalThis.fetch=old;globalThis.caches=caches0;}
});
test('quote vendor missing timestamp cannot be relabelled as current trading data',async()=>{
 const old=globalThis.fetch,caches0=globalThis.caches;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 globalThis.fetch=async u=>String(u).includes('finance.yahoo.com')?new Response('error',{status:502}):
 new Response('Symbol,Date,Time,Open,High,Low,Close,Volume\nRY,N/D,N/D,1,2,1,150,149',{status:200});
 try{
  const reply=await quotesGet({request:new Request('https://app.local/api/quotes?symbols=^GSPC&fresh=1'),waitUntil:()=>{}});
  const item=(await reply.json()).items[0];
  assert.equal(item.provider,'Stooq (fallback)');
  assert.equal(item.time,null);
  assert.equal(item.timestampVerified,false);
  assert.equal(item.delayed,true);
 }finally{globalThis.fetch=old;globalThis.caches=caches0;}
});
test('news articles missing a publication date are not represented as newly published',async()=>{
 const old=globalThis.fetch;
 const good=new Date(Date.now()-864e5).toUTCString();
 const xml='<rss><channel><item><title>Canada mortgage interest rates and inflation from Bank of Canada</title><link>https://example.com/dated</link><pubDate>'+good+'</pubDate></item>'+
 '<item><title>Canada mortgage inflation undated note should not look new</title><link>https://example.com/no-date</link></item></channel></rss>';
 globalThis.fetch=async u=>new Response(String(u).includes('gdeltproject.org')?JSON.stringify({articles:[]}):xml,{status:200});
 try{
  const reply=await newsGet({request:new Request('https://app.local/api/news?scope=global&category=finance&city=Calgary&region=Alberta&country=CA&fresh=1'),env:{}});
  const j=await reply.json();
  assert.ok(j.items.some(x=>x.link==='https://example.com/dated'));
  assert.ok(j.items.every(x=>x.link!=='https://example.com/no-date'));
  assert.ok(j.items.every(x=>x.date&&Number.isFinite(Date.parse(x.date))));
 }finally{globalThis.fetch=old;}
});
test('public health checker distinguishes outages from estimates and disconnected services',()=>{
 const date=new Date('2026-10-28T20:00:00Z');
 const data={
  rates:{fetched:'2026-10-28T19:50:00Z',policy:{value:2.5},prime:{value:4.45,date:'2026-10-21'},
   primeAnnouncement:{value:4.7,effectiveDate:'2026-10-29',confirmed:true}},
  rules:{year:2026,status:'official_with_estimates',checked:'2026-10-28T18:00:00Z'},
  quotes:{items:[{time:date.getTime()-60*60000,timestampVerified:true}]},
  news:{items:[{date:'2026-10-28T17:00:00Z'}],sourceStatus:[{ok:true}]},
  homes:{enabled:false}
 };
 const a=inspectPublicFeeds(data,date);
 assert.equal(a.errors.length,0);
 assert.equal(a.findings.find(x=>x.source==='Licensed listings').status,'ok');
 const bad=inspectPublicFeeds({...data,quotes:{items:[{time:null,timestampVerified:false}]},rules:{year:2025}},date);
 assert.ok(bad.errors.some(x=>x.source==='Canadian annual tax rules'));
 assert.ok(bad.warnings.some(x=>x.source==='Market quotations'));
});
test('UI distinguishes market timestamps and independent saved financial figures',()=>{
 const quote=read('ec-v10.js'),index=read('index.html'),health=read('ec-data-health.js');
 assert.match(quote,/ec10-quote-asof/);
 assert.match(health,/Manual inputs/);
 assert.match(health,/not fact-checked|not verified|not independently/i);
 assert.ok(index.includes('ec-data-health.js?v=16.10'));
 assert.doesNotMatch(health,/V\.home\s*=|V\.homes\s*=/);
});
