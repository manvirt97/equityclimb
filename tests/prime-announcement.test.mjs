import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePrimeRelease,parseTdPostedPrime,resolvePrime,onRequestGet} from '../functions/api/boc.js';
const RBC={ lender:'RBC Royal Bank',date:'2026-10-28',url:'https://www.rbc.com/newsroom/article.html?article=126172' };
const TD={ lender:'TD Canada Trust',date:'2026-10-28',url:'https://td.mediaroom.com/2026-10-28-TD-Canada-Trust-announces-change-to-TD-Prime-Rate' };
const rbcText='<article>RBC Royal Bank is increasing its prime rate by 25 basis points from 4.45 per cent to 4.70 per cent, effective October 29, 2026.</article>';
const tdText='<article>TD Canada Trust today announced that it has increased its TD Prime Rate by 25 basis points to 4.70%, effective October 29, 2026.</article>';
const prior={value:4.45,date:'2026-10-21',change:0};

test('parse only lender-authored confirmed prime announcements, not inferred policy spreads',()=>{
 for(const [body,meta] of [[rbcText,RBC],[tdText,TD]]){
  const news=parsePrimeRelease(body,meta);
  assert.equal(news.value,4.7);
  assert.equal(news.date,'2026-10-28');
  assert.equal(news.effectiveDate,'2026-10-29');
  assert.equal(news.sourceUrl,meta.url);
  assert.equal(news.confirmed,true);
 }
 assert.equal(parsePrimeRelease('Prime expected to reach 4.70%',RBC),null);
 assert.equal(parsePrimeRelease(rbcText,{...RBC,url:'https://example.com/spoof'}),null);
 assert.equal(parsePrimeRelease('Bank of Canada policy rate to 2.50%',TD),null);
});
test('posted TD website supports rate updates independently of one-off lender release',()=>{
 const site='<table><tr><td>TD Prime Rate</td><td>4.45%</td><td>Oct 30, 2025</td></tr></table>';
 const p=parseTdPostedPrime(site);
 assert.equal(p.value,4.45);assert.equal(p.effectiveDate,'2025-10-30');assert.equal(p.posted,true);
 assert.equal(parseTdPostedPrime('unavailable'),null);
});
test('before October 29, show announced 4.70% while keeping effective 4.45% for payments',()=>{
 const confirmed=parsePrimeRelease(rbcText,RBC),out=resolvePrime(prior,confirmed,'2026-10-28');
 assert.equal(out.prime.value,4.45);
 assert.equal(out.primeAnnouncement.value,4.7);
 assert.equal(out.primePending,true);
 assert.equal(out.primeObserved.date,'2026-10-21');
});
test('effective October 29, selected prime becomes 4.70% despite weekly series lag',()=>{
 const confirmed=parsePrimeRelease(rbcText,RBC),out=resolvePrime(prior,confirmed,'2026-10-29');
 assert.equal(out.prime.value,4.7);
 assert.equal(out.prime.date,'2026-10-29');
 assert.equal(out.primePending,false);
 assert.equal(out.prime.change,0.25);
});
test('future later official weekly observation supersedes a stale lender announcement',()=>{
 const p=resolvePrime({value:4.95,date:'2026-12-09'},parsePrimeRelease(rbcText,RBC),'2026-12-10');
 assert.equal(p.prime.value,4.95);
 assert.equal(p.primeAnnouncement,undefined);
});
test('live BoC endpoint returns 4.70 announcement with official source while keeping current effective rate',async()=>{
 const previous=globalThis.fetch;
 const policyUrl='https://www.bankofcanada.ca/2026/10/fad-press-release-2026-10-28/';
 const policyHtml='<div>The Bank of Canada today increased its target for the overnight rate by 25 basis points to 2.5%, with the Bank Rate at 2.75%.</div>';
 const pressFeed='<rss><item><title>Bank of Canada raises the policy rate by 25 basis points to 2½%</title><link>'+policyUrl+'</link><pubDate>Wed, 28 Oct 2026 14:00:00 GMT</pubDate></item></rss>';
 globalThis.fetch=async u=>{
  u=String(u);
  const id=u.match(/\/valet\/observations\/([^/]+)\/json\?recent=/)?.[1];
  let text;
  if(id){
   const v=id==='V80691311'?'4.45':id==='V39079'?'2.25':'3.50';
   const d=id==='V80691311'?'2026-10-21':'2026-10-27';
   text=JSON.stringify({observations:[{d,[id]:{v}},{d:'2026-10-06',[id]:{v}}]});
  }else if(u.includes('content_type/press-releases/feed')||u.includes('press/press-releases/feed'))text=pressFeed;
  else if(u===policyUrl)text=policyHtml;
  else if(u===RBC.url)text=rbcText;
  else if(u===TD.url)text=tdText;
  else if(u.includes('/todays-rates-and-prime'))text='<div><table><tr><td>TD Prime Rate</td><td>4.45%</td><td>Oct 30, 2025</td></tr></table></div>';
  else if(u.includes('press/press-releases'))text=pressFeed;
  else throw new Error('Unknown URL '+u);
  return new Response(text,{status:200,headers:{'content-type':id?'application/json':'text/html'}});
 };
 try{
  const r=await onRequestGet({request:new Request('https://app.local/api/boc?fresh=1')});
  const j=await r.json();
  assert.equal(r.status,200,JSON.stringify(j.errors||{}));
  assert.equal(j.primeAnnouncement.value,4.7);
  assert.equal(j.primeAnnouncement.effectiveDate,'2026-10-29');
  assert.equal(j.primeAnnouncement.confirmed,true);
  assert.equal(j.primeObserved.value,4.45);
  assert.equal(j.policy.value,2.5);
 }finally{globalThis.fetch=previous;}
});
test('render and cache are restricted to rate widgets; no Home or Shortlist override',()=>{
 const v8=readFileSync(new URL('../public/ec-v8.js',import.meta.url),'utf8');
 const v16=readFileSync(new URL('../public/ec-v16.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 assert.match(v8,/merged\.primeAnnouncement=S1\.primeAnnouncement/);
 const marketRefresh=readFileSync(new URL('../public/ec-v10.js',import.meta.url),'utf8');
 assert.match(marketRefresh,/el\.innerHTML=root \? root\.innerHTML : updated/);
 assert.match(marketRefresh,/chip\.textContent=pct\(confirmed\.value,2\)/);
 assert.match(v16,/Confirmed by \$\{E\(primeNext\.lender/);
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/RATES\?\.primeAnnouncement\?\.confirmed/);
 assert.match(index,/app\.js\?v=16\.9/);
 assert.match(index,/ec-v10\.js\?v=16\.7\.2/);
 assert.match(v16,/Confirmed major-bank prime/);
 assert.match(v16,/primeDisplay/);
 assert.match(index,/ec-v16\.js\?v=16\.7\.2/);
 assert.match(sw,/eq-v16-9-rate-integrity/);
 const main=readFileSync(new URL('../public/ec-v16-5.js',import.meta.url),'utf8');
 assert.doesNotMatch(main,/V\.home\s*=/);
});
