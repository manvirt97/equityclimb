import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const f=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('v16.1 redesigned home has net worth and cash flow in the hero',()=>{const s=f('../public/ec-v16-1.js');assert.match(s,/YOUR NET WORTH/);assert.match(s,/MONTHLY CASH FLOW/);assert.match(s,/ec161-three-metrics/);});
test('v16.1 does not render fake property inventory',()=>{const s=f('../public/ec-v16-1.js');assert.match(s,/noFeedWorkspace/);assert.match(s,/Browse REALTOR.ca/);assert.match(s,/Add your property/);assert.doesNotMatch(s,/FICTIONAL DEMO|Illustrative townhouse|demoCard/);});
test('v16.1 hard-refreshable JS CSS cache resources',()=>{const h=f('../public/index.html'),sw=f('../public/sw.js');assert.match(h,/ec-v16-1\.js\?v=16\.1/);assert.match(h,/ec-v16-1\.css\?v=16\.1/);assert.match(sw,/eq-v16-4-discovery-studio/)});
