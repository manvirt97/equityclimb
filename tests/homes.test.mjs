import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeListing,onRequestGet} from '../functions/api/homes.js';
const req=(query='')=>new Request('https://equityclimb.test/api/homes'+query);
test('returns honest no-feed state when license not enabled',async()=>{
 const r=await onRequestGet({request:req('?city=Calgary'),env:{}});
 const j=await r.json(); assert.equal(j.enabled,false); assert.deepEqual(j.items,[]);assert.equal(j.total,null);
});
test('normalizes listings, hides restricted address, restricts images',()=>{
 const x=normalizeListing({mlsNumber:'X123',listPrice:500000,address:{city:'Calgary',streetNumber:'12',streetName:'Main'},displayAddressOnInternet:'N',
  details:{numBedrooms:3,numBathrooms:2},images:['area/test.jpg','../bad.jpg','https://evil.test/x.jpg'],map:{lat:51,long:-114}});
 assert.equal(x.address,'Address withheld by listing agent');assert.equal(x.lat,null);assert.equal(x.lng,null);
 assert.deepEqual(x.images,['https://cdn.repliers.io/area/test.jpg']);
});
test('enabled feed sends a validated server-side request with secret header',async()=>{
 const old=globalThis.fetch;
 let called;
 globalThis.fetch=async (url,opts)=>{called={url,opts};return new Response(JSON.stringify({page:1,numPages:2,count:20,listings:[
   {mlsNumber:'AB123',listPrice:750000,address:{city:'Calgary',streetNumber:'10',streetName:'Main'},details:{numBedrooms:3,numBathrooms:2,propertyType:'Detached'},images:[]},
   {mlsNumber:'HIDDEN',listPrice:500000,displayInternetEntireListing:'N'}]}),{status:200});};
 try {
  const r=await onRequestGet({request:req('?city=Calgary&maxPrice=900000&beds=3&baths=2'),env:{REPLIERS_API_KEY:'testsecret',HOMES_PUBLIC_ENABLED:'on'}});
  const j=await r.json();assert.equal(j.enabled,true);assert.equal(j.items.length,1);assert.equal(j.items[0].id,'AB123');
  assert.equal(new URL(called.url).searchParams.get('maxPrice'),'900000');
  assert.equal(new URL(called.url).searchParams.get('minBaths'),'2');
  assert.equal(called.opts.headers['REPLIERS-API-KEY'],'testsecret');
  assert.ok(!JSON.stringify(j).includes('testsecret'));
 } finally{globalThis.fetch=old;}
});
test('invalid price bounds are rejected without upstream request',async()=>{
 const r=await onRequestGet({request:req('?city=Calgary&minPrice=900000&maxPrice=500000'),env:{REPLIERS_API_KEY:'placeholder',HOMES_PUBLIC_ENABLED:'on'}});
 assert.equal(r.status,400);
});
