(function(){
'use strict';
const form=document.getElementById('model');
const money=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
const get=(v,key,min,max)=>{const raw=v[key];const n=Number(raw);if(raw===''||!Number.isFinite(n)||n<min||n>max)throw Error('Invalid '+key);return n};
exported();
function exported(){}
function futureValue(principal,monthly,annualReturn,years){
 const count=Math.round(years*12),r=Math.pow(1+annualReturn/100,1/12)-1;
 if(Math.abs(r)<1e-12)return principal+monthly*count;
 return principal*Math.pow(1+r,count)+monthly*((Math.pow(1+r,count)-1)/r);
}
let last=null;
function run(){
 try{
 const v=Object.fromEntries(new FormData(form).entries());
 const start=get(v,'start',0,100000000),monthly=get(v,'monthly',0,1000000),boost=get(v,'boost',0,1000000),years=get(v,'years',1,60),rate=get(v,'rate',-10,20),goal=get(v,'goal',100,100000000);
 const baseline=futureValue(start,monthly,rate,years),improved=futureValue(start,monthly+boost,rate,years),delta=improved-baseline;
 last={baseline,improved,delta,boost,years,rate};
 document.getElementById('baseline').textContent=money(baseline);
 document.getElementById('boosted').textContent=money(improved);
 document.getElementById('difference').textContent=(delta>=0?'+':'')+money(delta);
 document.getElementById('moment-label').textContent='Illustrative change after '+years+' years from saving '+money(boost)+' more per month, using a '+rate+'% annual return assumption.';
 const scale=Math.max(1,baseline,improved);
 document.getElementById('oldbar').style.width=Math.max(0,baseline/scale*100)+'%';
 document.getElementById('newbar').style.width=Math.max(0,improved/scale*100)+'%';
 let reached1=null,reached2=null;for(let month=0;month<=720;month++){const t=month/12;if(reached1===null&&futureValue(start,monthly,rate,t)>=goal)reached1=month;if(reached2===null&&futureValue(start,monthly+boost,rate,t)>=goal)reached2=month;if(reached1!==null&&reached2!==null)break;}
 const label=n=>n===null?'not reached within 60 years':n===0?'already reached':Math.ceil(n/12)+' yr '+n%12+' mo';
 document.getElementById('milestone').textContent='Illustrative '+money(goal)+' savings target: '+label(reached1)+' at today’s savings rate versus '+label(reached2)+' with the change. Actual markets do not return a fixed rate each month.';
 }catch(e){last=null;document.getElementById('baseline').textContent='Check inputs';document.getElementById('boosted').textContent='—';document.getElementById('difference').textContent='—';document.getElementById('milestone').textContent='Complete valid assumptions to calculate.';}
}
form.addEventListener('input',run);
document.getElementById('share').addEventListener('click',async()=>{
 if(!last)return;const note=document.getElementById('share-note'),show=document.getElementById('numbers').checked;
 const text='EquityClimb Financial Time Machine: I compared two savings habits.'+(show?' My hypothetical future balances: '+money(last.baseline)+' vs '+money(last.improved)+' after '+last.years+' years. Difference: '+money(last.delta)+'.':'')+' These are fictional scenarios based on my own assumptions, not predictions. Try yours: '+location.origin+'/time-machine.html';
 try{if(navigator.share)await navigator.share({title:'My financial time machine (illustrative)',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);note.textContent='Scenario text copied. No private values were included unless you checked the box.';}else note.textContent='Share this page: '+location.href;}catch(e){if(e.name!=='AbortError')note.textContent='Sharing is not available here; share the page URL.';}
});
run();
})();