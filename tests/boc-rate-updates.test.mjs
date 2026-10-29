import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarize, spreadInfo, parsePolicyAnnouncement, latestOfficialPolicy, onRequestGet} from '../functions/api/boc.js';
import {onRequestGet as legacyRatesGet} from '../functions/api/rates.js';

const RELEASE='https://www.bankofcanada.ca/2026/10/fad-press-release-2026-10-28/';
const BODY='<main><p>The Bank of Canada today increased its target for the overnight rate by 25 basis points to 2.5%, with the Bank Rate at 2.75% and the deposit rate at 2.45%.</p></main>';
const pRows=[
 {d:'2026-10-27',V39079:{v:'2.25'}},
 {d:'2026-10-26',V39079:{v:'2.25'}},
 {d:'2026-10-23',V39079:{v:'2.25'}},
 {d:'2026-09-17',V39079:{v:'2.25'}},
 {d:'2026-09-16',V39079:{v:'2.50'}}
];
const primeRows=[
 {d:'2026-10-27',V80691311:{v:'4.45'}},
 {d:'2026-10-20',V80691311:{v:'4.45'}},
 {d:'2026-10-13',V80691311:{v:'4.45'}},
 {d:'2026-10-06',V80691311:{v:'4.45'}}
];
const staticJs=readFileSync(new URL('../public/ec-v8.js',import.meta.url),'utf8');
const marketJs=readFileSync(new URL('../public/ec-v16.js',import.meta.url),'utf8');
const updateJs=readFileSync(new URL('../public/ec-v16-2.js',import.meta.url),'utf8');
const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');

test('Valet observations newest-FIRST are sorted correctly and the last rate change is meaningful',()=>{
 const result=summarize(pRows,'V39079');
 assert.equal(result.value,2.25);
 assert.equal(result.date,'2026-10-27');
 assert.equal(result.change,-0.25);
 assert.equal(result.lastChange,'2026-09-17');
});
test('prime spread calculations are based on chronological series not response order',()=>{
 const s=spreadInfo(primeRows,'V80691311',pRows,'V39079');
 assert.equal(s.policyDate,'2026-10-27');
 assert.equal(s.primeDate,'2026-10-27');
 assert.equal(s.prime,4.45);
});
test('only dated official releases can announce a new rate; parse the overnight target rather than Bank Rate',()=>{
 const p=parsePolicyAnnouncement(BODY,'2026-10-28',RELEASE);
 assert.equal(p.value,2.5);
 assert.equal(p.date,'2026-10-28');
 assert.equal(p.effectiveDate,'2026-10-29');
 assert.equal(p.announced,true);
 assert.equal(parsePolicyAnnouncement(BODY,'2026-10-28','https://example.com/fake'),null);
 assert.equal(parsePolicyAnnouncement('<p>Bank Rate at 2.75%</p>','2026-10-28',RELEASE),null);
});
test('announcement value supersedes last business-daily observation without altering prime',async()=>{
 const observed=summarize(pRows,'V39079');
 const ann=await latestOfficialPolicy([{title:'Bank raises policy rate',date:'2026-10-28',link:RELEASE}],observed,{getText:async()=>BODY});
 assert.equal(ann.value,2.5);
 assert.equal(ann.change,0.25);
 assert.equal(ann.observed.value,2.25);
 const old=await latestOfficialPolicy([{date:'2026-10-20',link:RELEASE}],observed,{getText:async()=>{throw Error('should not fetch older release')}});
 assert.equal(old,null);
});
test('full /api/boc response reconciles official announcement with observed daily target',async()=>{
 const original=globalThis.fetch;
 const feed='<rss><channel><item><title>Bank of Canada raises the policy rate by 25 basis points to 2.5%</title><link>'+RELEASE+'</link><pubDate>Wed, 28 Oct 2026 14:00:00 GMT</pubDate></item></channel></rss>';
 const seen=[];
 const fakeFetch=async input=>{
   const u=String(input);
   seen.push(u);
   if(u.includes('/valet/observations/')&&u.includes('&_='))return new Response('unsupported query parameter',{status:400});
   let body;
   if(u.includes('/valet/observations/')){
     const id=u.match(/\/observations\/([^/]+)\//)?.[1];
     let observations=id==='V39079'?pRows:id==='V80691311'?primeRows:
       [{d:'2026-10-27',[id]:{v:'3.50'}},{d:'2026-10-26',[id]:{v:'3.50'}}];
     body=JSON.stringify({observations});
   }else if(u.includes('/feed/'))body=feed;
   else if(u===RELEASE)body=BODY;
   else if(u.includes('/press/press-releases/'))body=feed;
   else throw new Error('Unexpected URL '+u);
   return new Response(body,{status:200,headers:{'content-type':u.includes('/valet/')?'application/json':'text/html'}});
 };
 globalThis.fetch=fakeFetch;
 try{
  const response=await onRequestGet({request:new Request('https://equityclimb.example/api/boc?fresh=1')});
  const data=await response.json();
  assert.equal(response.status,200,JSON.stringify(data));
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(data.policy.value,2.5);
  assert.equal(data.policy.date,'2026-10-28');
  assert.equal(data.policyAnnouncement.effectiveDate,'2026-10-29');
  assert.equal(data.policyObserved.value,2.25);
  assert.equal(data.prime.value,4.45);
  assert.equal(data.prime.date,'2026-10-27');
  assert.ok(seen.some(u=>u.includes('V39079/json?recent=')));
  assert.ok(seen.every(u=>!u.includes('/valet/observations/')||!u.includes('&_=')));
 } finally{globalThis.fetch=original;}
});
test('daily-only rates fallback chooses newest observation independently for each series',async()=>{
 const original=globalThis.fetch;
 const requested=[];
 globalThis.fetch=async u=>{requested.push(String(u));return new Response(JSON.stringify({observations:[...pRows,...primeRows]}),{status:200});};
 try{
  const res=await legacyRatesGet({request:new Request('https://equityclimb.example/api/rates?fresh=1')});
  const data=await res.json();
  assert.equal(res.status,200);
  assert.equal(data.policy.value,2.25);
  assert.equal(data.policy.date,'2026-10-27');
  assert.equal(data.prime.value,4.45);
  assert.equal(data.prime.date,'2026-10-27');
  assert.equal(res.headers.get('cache-control'),'no-store');
  assert.ok(requested.every(u=>!u.includes('&_=')));
 } finally{globalThis.fetch=original;}
});
test('rate refresh and market disclosure are automatic, without touching Home dashboard markup',()=>{
 assert.match(staticJs,/sort\(\(a,b\) => a\.d\.localeCompare\(b\.d\)\)/);
 assert.doesNotMatch(staticJs,/recent=\$\{n\}&_/);
 assert.match(staticJs,/addEventListener\('focus'/);
 assert.match(staticJs,/setInterval\(\(\) => \{ if \(!document\.hidden/);
 assert.match(marketJs,/ec16-boc-bulletin/);
 assert.match(marketJs,/Bank of Canada policy decision/);
 assert.match(marketJs,/prime rate is set by banks/i);
 assert.match(updateJs,/\/api\/boc\?fresh=1/);
 assert.match(sw,/eq-v16-8-ios-update/);
});
