/* EquityClimb v15.4: honest licensed MLS source status.
 * Does not fabricate listings or claim the API is connected without authorization.
 * Existing Real Estate navigation, saved properties, financial calculators remain unchanged. */
(() => {
 'use strict';
 if(window.__ec154 || typeof V==='undefined')return;
 window.__ec154=true;
 const existing=V.homes;
 if(typeof existing==='function') V.homes=function(){
   const html=existing.apply(this,arguments);
   const panel=`<section class="ec154-feed" aria-label="MLS listing feed information">
     <div><div class="ec154-overline">CANADIAN PROPERTY DATA</div><strong>Authorized MLS inventory</strong>
     <p id="ec154-state" aria-live="polite">Checking listing feed connection…</p></div>
     <a href="https://www.realtor.ca/ddf/real-estate-advertising-websites" target="_blank" rel="noopener noreferrer">About official data access ↗</a>
   </section>`;
   return html.replace('<div class="ec13-tabs"',panel+'<div class="ec13-tabs"');
 };
 let stamp=0;
 const render0=window.render;
 if(typeof render0==='function')window.render=function(){
   const v=render0.apply(this,arguments);
   if(typeof cur==='string'&&cur==='homes'){
     const el=document.getElementById('ec154-state');
     if(el && Date.now()-stamp>15000){stamp=Date.now();
       fetch('/api/homes?mode=status',{cache:'no-store'}).then(r=>r.json()).then(j=>{
         if(el!==document.getElementById('ec154-state'))return;
         el.textContent=j.enabled?(j.provider+' feed enabled — coverage depends on permission.'):
           (j.ddf?.credentialsPresent?'DDF credentials present; public MLS display is awaiting approval and compliance checks.':
            'Live MLS inventory is not connected. You can still use property comparisons and the buying guide.');
       }).catch(()=>{if(el===document.getElementById('ec154-state'))el.textContent='Unable to check feed status. Existing planning tools remain available.';});
     }
   }
   return v;
 };
})();
