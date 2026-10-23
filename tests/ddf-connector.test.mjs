import test from 'node:test';
import assert from 'node:assert/strict';
import { ddfCredentialsPresent,ddfPublicApproved,getDdfToken,ddfSearchParams,normalizeDdfProperty,queryDdfListings } from '../functions/_shared/ddf-client.js';
import {onRequestPost as diagnose} from '../functions/api/ddf-diagnostics.js';
import {onRequestGet as homes} from '../functions/api/homes.js';
const q=s=>new URL('https://equityclimb.test/api/homes?'+s).searchParams;
const env={DDF_CLIENT_ID:'test-user-154',DDF_CLIENT_SECRET:'secret-154'};
test('disabled DDF does not expose records when credentials are present',async()=>{
 const res=await homes({request:new Request('https://equityclimb.test/api/homes?city=Calgary'),env});
 const body=await res.json();assert.equal(body.enabled,false);assert.deepEqual(body.items,[]);
 const status=await homes({request:new Request('https://equityclimb.test/api/homes?mode=status'),env});
 const j=await status.json();assert.equal(j.ddf.credentialsPresent,true);assert.equal(j.ddf.publicEnabled,false);
});
test('DDFApi approved flags must ALL be on',()=>{
 assert.equal(ddfCredentialsPresent(env),true);
 assert.equal(ddfPublicApproved({...env,DDF_WRITTEN_RIGHTS:'on',DDF_PUBLIC_ENABLED:'on'}),false);
});
test('OData filter is encoded and city quotes cannot inject extra filters',()=>{
 const {params}=ddfSearchParams(q("city=O%27Brien&beds=3&maxPrice=700000"));
 assert.match(params.get('$filter'),/City eq 'O''Brien'/);
 assert.match(params.get('$filter'),/BedroomsTotal ge 3/);
 assert.match(params.get('$filter'),/ListPrice le 700000/);
 assert.throws(()=>ddfSearchParams(q('city=Calgary&minPrice=900000&maxPrice=800000')));
});
test('normalization respects hidden addresses and filters unsafe photos',()=>{
 const p=normalizeDdfProperty({ListingKey:'K123',ListingId:'ABC',ListPrice:550000,City:'Calgary',InternetAddressDisplayYN:false,
 Media:[{MediaURL:'http://insecure.test/1.jpg'},{MediaURL:'https://ddfcdn.realtor.ca/photo.jpg',MediaCategory:'Photo'}],BedroomsTotal:3,BathroomsTotalInteger:2,Latitude:51,Longitude:-114});
 assert.equal(p.address,'Address withheld by listing agent');assert.equal(p.lat,null);
 assert.deepEqual(p.images,['https://ddfcdn.realtor.ca/photo.jpg']);
});
test('token and listing requests stay server-side and never expose secrets',async()=>{
 let calls=[];
 const mock=async (url,opts)=>{
  calls.push({url,opts});
  if(String(url).includes('/connect/token'))return new Response(JSON.stringify({access_token:'opaque-test-token',expires_in:3600}),{status:200});
  return new Response(JSON.stringify({value:[{ListingKey:'key-1',ListPrice:450000,City:'Calgary',BedroomsTotal:3,StandardStatus:'Active'}]}),{status:200});
 };
 const data=await queryDdfListings(env,q('city=Calgary&beds=3'),mock);
 assert.equal(data.provider,'REALTOR.ca DDF');assert.equal(data.items[0].id,'key-1');
 assert.match(calls[0].opts.body,/client_credentials/);
 assert.ok(calls[1].opts.headers.authorization.startsWith('Bearer '));
 assert.ok(!JSON.stringify(data).includes('opaque-test-token'));
});
test('owner diagnostic denies missing or incorrect tokens',async()=>{
 const e={...env,DDF_DIAGNOSTIC_TOKEN:'owners-only'};
 const a=await diagnose({request:new Request('https://equityclimb.test/api/ddf-diagnostics',{method:'POST'}),env:e});
 assert.equal(a.status,403);
 const b=await diagnose({request:new Request('https://equityclimb.test/api/ddf-diagnostics',{method:'POST',headers:{'x-equityclimb-admin-token':'wrong'}}),env:e});
 assert.equal(b.status,403);
});
