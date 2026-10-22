/* EquityClimb v15.3 — simpler Home and distinctive Real Estate navigation.
   Presentation-only changes. No formulas, account data, AI billing or MLS permissions modified. */
(() => {
  'use strict';
  if (window.__ec153 || typeof V === 'undefined' || !window.EC15) return;
  window.__ec153 = true;

  const A = window.EC_NAV;
  if (A) for (const list of [A.MAIN, A.MOBILE, A.EXTRA]) {
    if (!Array.isArray(list)) continue;
    for (const row of list) if (row?.[0] === 'homes') row[1] = 'Real Estate';
  }
  // Navigation keeps the existing #homes route and saved properties unchanged.
  const baseMore = V.more;
  if (typeof baseMore === 'function') {
    V.more = function () {
      const html = baseMore.apply(this, arguments);
      try {
        const t = document.createElement('template'); t.innerHTML = html;
        t.content.querySelectorAll('button[onclick="go(\'homes\')"] span').forEach(x => x.textContent = 'Real Estate');
        const d = document.createElement('div'); d.append(t.content); return d.innerHTML;
      } catch (_) { return html; }
    };
  }

  const oldHomes = V.homes;
  if (typeof oldHomes === 'function') V.homes = function () {
    const html = oldHomes.apply(this, arguments);
    return html.replace(/(<div class="eyebrow">)Homes(<\/div>)/i, '$1Real Estate$2');
  };

  function readOpen(id) { try { return localStorage.getItem('ec153-details-' + id) === 'open'; } catch (_) { return false; } }
  window.EC153 = {
    setOpen(id, open) { if (!['insights','weekly'].includes(id)) return;
      try { localStorage.setItem('ec153-details-' + id, open ? 'open' : 'closed'); } catch (_) {} }
  };
  function heading(kicker, heading, help) {
    const outer = document.createElement('div'); outer.className = 'ec153-section-heading';
    const left=document.createElement('div');
    const eyebrow=document.createElement('span'); eyebrow.className='ec153-eyebrow'; eyebrow.textContent=kicker;
    const h=document.createElement('h2'); h.textContent=heading;
    left.append(eyebrow,h); outer.append(left);
    if(help){const small=document.createElement('span');small.className='ec153-heading-help';small.textContent=help;outer.append(small);}
    return outer;
  }
  function openDetails(id, label, sub) {
    const d=document.createElement('details'); d.className='ec153-details ec153-'+id;
    if(readOpen(id)) d.open=true;
    d.setAttribute('ontoggle',`EC153.setOpen('${id}',this.open)`);
    const s=document.createElement('summary');
    const b=document.createElement('strong');b.textContent=label;
    const c=document.createElement('span');c.textContent=sub;
    s.append(b,c);d.append(s);
    return d;
  }
  function organizeHome(html) {
    const t = document.createElement('template'); t.innerHTML=html;
    const root=t.content;
    const kpis=root.querySelector('.grid.g4:not(.mini)');
    const monthly=root.querySelector('.grid.g4.mini');
    const chart=root.querySelector('.grid.g21');
    const market=[...root.children].find(x => x.classList?.contains('card') && x.querySelector(':scope > .head > h2')?.textContent?.trim()==='Market');
    const footer=root.querySelector('.foot');
    if(!kpis || !monthly || !market || !footer) return html;
    kpis.classList.add('ec153-primary-metrics');
    monthly.classList.add('ec153-secondary-metrics');
    kpis.before(heading('YOUR FINANCES','Financial snapshot','Based on the numbers in your profile'));
    monthly.before(heading('MONTHLY PICTURE','Money in and out','Quick reference'));
    // Market remains visible. Large charts and recommendations are accessible on demand.
    market.classList.add('ec153-market');
    market.before(heading('MARKET CONTEXT','Rates and market','Sourced rates where available'));
    if(chart) {
      const before=chart.previousElementSibling;
      if(before?.classList?.contains('sp')) before.remove();
      const after=chart.nextElementSibling;
      if(after?.classList?.contains('sp')) after.remove();
      const extra=openDetails('insights','Projections & opportunities','Explore long-term estimates and personalized ideas');
      extra.append(chart);
      market.after(extra);
    }
    const gap=root.querySelector('.ec152-before-actions');if(gap)gap.remove();
    const path=root.querySelector('.ec15-home-path');
    const start=root.querySelector('.ec13-home-start');
    if(path || start) {
      const next=document.createElement('section'); next.className='ec153-next';
      next.append(heading('TAKE ACTION','Your next steps','Practical help when you want it'));
      const two=document.createElement('div');two.className='ec153-next-grid';
      if(path)two.append(path);
      const lead=start?.querySelector('.ec13-home-lead');if(lead)two.append(lead);
      next.append(two);
      const learnCards=start?.querySelector('.ec13-home-cards');
      const week=start?.querySelector('.ec13-week');
      const health=root.querySelector('.ec-top');
      if(learnCards || week || health) {
        const more=openDetails('weekly','Financial health, learning & weekly goals','Optional tools and practical challenges');
        const body=document.createElement('div');body.className='ec153-activity-body';
        if(health) { const before=health.previousElementSibling; if(before?.classList?.contains('sp'))before.remove(); body.append(health); }
        if(learnCards)body.append(learnCards);
        if(week)body.append(week);
        more.append(body);next.append(more);
      }
      if(start)start.remove();
      footer.before(next);
    }
    const d=document.createElement('div');d.append(root);return d.innerHTML;
  }
  if (typeof V.home==='function') {
    const previous=V.home;
    V.home=function(){const html=previous.apply(this,arguments);try{return organizeHome(html);}catch(err){console.warn('Optional Home organization skipped',err);return html;}};
  }
  const oldRender=window.render;
  if(typeof oldRender==='function') {
    window.render=function(){const result=oldRender.apply(this,arguments);
      document.querySelectorAll('#side .ec14-nav-item[onclick="go(\'homes\')"] span').forEach(x=>x.textContent='Real Estate');
      // Footer displays navigation names drawn from the EC_NAV arrays above.
      return result;
    };
  }
  if (S.profile?.onboarded) {try{render();}catch(_) {}}
})();
