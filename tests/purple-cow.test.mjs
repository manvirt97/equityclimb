import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('time machine is reachable from home and respects private-by-default sharing',()=>{
 const home=fs.readFileSync('public/ec-v16-11.js','utf8'),page=fs.readFileSync('public/time-machine.html','utf8'),js=fs.readFileSync('public/time-machine.js','utf8');
 assert.match(home,/\/time-machine\.html/);assert.match(page,/id="numbers" type="checkbox"/);assert.match(js,/getElementById\('numbers'\)\.checked/);
 assert.match(page,/hypothetical|scenario/i);assert.doesNotMatch(js,/fetch\(/);
});