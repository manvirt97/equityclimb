/* EquityClimb v6 - Phase 1: unified data model, tested engine, 5-group budget, new dashboard and navigation.
   Loads AFTER app.js and BEFORE v5-market.js. Keeps Market, Neighbourhoods, Buying, Goals, Advisor and Settings. */
(() => {
  'use strict';
  const E = window.ECEngine;
  if (!E) { console.error('engine.js did not load'); return; }
  const n = v => (Number.isFinite(+v) ? +v : 0);

  /* 1. MIGRATION (no data lost) */
  function migrate() {
    if ((S.schema || 0) >= 6) return;
    try { const raw = localStorage.getItem('ho'); if (raw && !localStorage.getItem('ho_backup_v5')) localStorage.setItem('ho_backup_v5', raw); } catch {}
    const sp = S.spend || {}, notes = [];
    const B = { income: { business: 0 },
      essentials: { housing: 0, groceries: 0, utilities: 0, insurance: 0, transport: 0, health: 0, other: 0 },
      lifestyle: { restaurants: 0, entertainment: 0, shopping: 0, travel: 0, hobbies: 0, subscriptions: 0, other: 0 },
      savings: { emergency: 0, tfsa: 0, rrsp: 0, fhsa: 0, nonreg: 0, other: 0 } };
    const housing = n(sp.Housing);
    if (S.profile.goal !== 'rent' && n(S.pmt) > 0 && housing >= n(S.pmt) * 0.9) {
      B.essentials.housing = Math.max(housing - n(S.pmt), 0);
      notes.push(`Housing was ${$(housing)} and looked like it included your ${$(S.pmt)} mortgage payment. The mortgage is now counted once under Debt payments, so Housing is ${$(B.essentials.housing)}.`);
    } else B.essentials.housing = housing;
    B.essentials.groceries = n(sp.Food); if (n(sp.Food)) notes.push('Food moved to Groceries. Move any restaurant spending to Lifestyle.');
    B.essentials.transport = n(sp.Transportation); B.essentials.health = n(sp.Health);
    B.lifestyle.shopping = n(sp.Personal); B.lifestyle.other = n(sp.Other);
    B.savings.other = n(sp.Savings); if (n(sp.Savings)) notes.push('Savings is no longer counted as spending. It is now a planned allocation.');
    const known = ['Housing', 'Transportation', 'Food', 'Personal', 'Health', 'Debt', 'Savings', 'Other'];
    Object.keys(sp).filter(k => !known.includes(k)).forEach(k => { B.lifestyle.other += n(sp[k]); notes.push(`Custom category "${k}" added to Other discretionary.`); });
    S.debts = S.debts || [];
    if (n(sp.Debt) > 0) { S.debts.push({ name: 'Other debt (from old budget)', type: 'Other', bal: 0, rate: 0, min: n(sp.Debt) }); notes.push('Your old "Debt" budget line became a debt. Add its balance and rate under Debt & Mortgage.'); }
    S.budget = B;
    S.compounding = S.compounding || (S.rtype === 'Fixed' ? 'Semi-annual' : 'Monthly');
    S.prepayPct = S.prepayPct ?? 15; S.tfsaNew = S.tfsaNew ?? 7000; S.rrspNew = S.rrspNew ?? 0; S.rentalExp = S.rentalExp ?? 490;
    S.buy = S.buy || {}; S.buy.rate = S.buy.rate ?? 4.5;
    S.migrationNotes = notes; S.schema = 6; save();
  }

  /* 2. SHARED MODEL (entered once, used everywhere) */
  const renewalMonth = () => { const d = new Date(S.maturity); if (isNaN(d)) return null; return Math.max(0, Math.round((d - today) / 2.63e9)); };
  const baseMonths = () => E.monthsToRepay(S.bal, S.rate, S.pmt, S.compounding);
  const mortgageParams = (rate = S.rate) => {
    const am = baseMonths();
    return { balance: n(S.bal), rate, payment: n(S.pmt), compounding: S.compounding, renewalMonth: renewalMonth(), renewalRate: n(S.renewRate) + (rate - S.rate), amortMonths: Number.isFinite(am) ? am : 300 };
  };
  const debtBal = () => (S.debts || []).reduce((s, d) => s + n(d.bal), 0);
  const hasMortgage = () => n(S.bal) > 0 && S.profile.goal !== 'rent' && S.profile.goal !== 'buy';
  function model() {
    const B = S.budget, rentInc = S.rentOn === 'Yes' ? n(S.rent) * (1 - n(S.vacancy) / 100) : 0;
    const debt = { mortgage: hasMortgage() ? n(S.pmt) : 0 }; (S.debts || []).forEach((d, k) => debt['d' + k] = n(d.min));
    const rentalCosts = S.rentOn === 'Yes' ? n(S.rentalExp) : 0;
    const t = E.budgetTotals({ income: { employment: S.income, business: B.income.business, rental: rentInc, other: S.otherInc }, essentials: { ...B.essentials, rentalCosts }, lifestyle: B.lifestyle, debt, savings: B.savings });
    const invest = n(S.tfsa) + n(S.rrsp) + n(S.nonreg), home = hasMortgage() ? n(S.home) : 0, mort = hasMortgage() ? n(S.bal) : 0;
    const assets = home + n(S.cash) + invest, liab = mort + debtBal();
    const mp = hasMortgage() ? E.amortize(mortgageParams()) : { months: 0, path: [0], interest: 0 };
    const dp = E.debtPlan(S.debts, 0);
    const essentialNeed = t.essentials + t.debt;
    return { ...t, rentInc, rentalCosts, invest, home, mort, assets, liab, net: assets - liab, mp, dp,
      emergencyMonths: essentialNeed > 0 ? n(S.cash) / essentialNeed : 0, essentialNeed,
      debtFree: Math.max(mp.months, dp.months) };
  }
  window.ECModel = model;

  /* 3. CORRECTED LEGACY FUNCTIONS (same names, engine-backed) */
  window.amort = (bal, rate, pmt, extra = 0, lump = 0) => {
    const r = E.amortize({ ...mortgageParams(rate), balance: bal, payment: pmt, extra, lump, lumpMonth: 7, lumpCap: n(S.origP) * n(S.prepayPct) / 100 });
    return { months: r.months, int: r.interest, path: r.path };
  };
  window.unlock = (extra = 0, growth = S.growth) => {
    const st = E.mortgageStepper(mortgageParams()); let h = n(S.home);
    for (let m = 0; m < 480; m++) { if (st.balance <= 0.8 * h) return m; st.step(extra); h *= Math.pow(1 + growth / 100, 1 / 12); }
    return null;
  };
  window.rentNet = () => {
    const eff = n(S.rent) * 12 * (1 - n(S.vacancy) / 100), exp = n(S.rentalExp) * 12, intr = n(S.bal) * n(S.rate) / 100 * n(S.suiteShare) / 100;
    return (eff - exp - Math.max(eff - exp - intr, 0) * n(S.mtr) / 100) / 12;
  };
  window.compare = () => {
    const c = E.compareStrategies({ ...mortgageParams(), extra: S.extra, years: S.years, ret: S.ret, mtr: S.mtr, retTax: S.retTax, tfsaRoom: S.tfsaRoom, tfsaNew: S.tfsaNew, rrspRoom: S.rrspRoom, rrspNew: S.rrspNew, origP: S.origP, prepayPct: S.prepayPct });
    window._lastCompare = c;
    return { prepay: c.prepay.net, tfsa: c.tfsa.net, rrsp: c.rrsp.net };
  };
  window.afford = () => {
    const b = S.buy, qual = E.qualifyingRate(b.rate), inc = n(b.income) / 12;
    const maxP = Math.min(inc * 0.39 - b.heat - b.tax, inc * 0.44 - b.heat - b.tax - b.debts);
    const i = E.periodicRate(qual, 'Semi-annual'), N = b.amort * 12, loan = Math.max(maxP, 0) * (1 - Math.pow(1 + i, -N)) / i;
    let max = 0;
    for (let p = 100000; p < 4e6; p += 5000) { const d = Math.min(b.down, p); if (d < E.minDownPayment(p)) break; const L = p - d, prem = L / p > .8 ? L * E.insurancePremium(d / p) : 0; if (L + prem > loan) break; max = p; }
    return { qual, loan, max, maxP, minDown: E.minDownPayment };
  };

  /* 4. SMALL UI HELPERS */
  const money = (path, val) => `<input type="number" inputmode="decimal" step="any" value="${n(val)}" onchange="set('${path}', +this.value); later()">`;
  const tag = (t, cls = '') => `<span class="tag ${cls}">${t}</span>`;
  const CALC = tag('Calculated', 'acc'), EST = tag('Estimate', 'warn');
  const askBtn = q => `<button class="ask-ai" onclick='askAbout(${JSON.stringify(q).replace(/'/g, '&#39;')})' title="Ask Copilot about this">${ic('ai')}<span>Ask</span></button>`;
  window.askAbout = q => { go('advisor'); setTimeout(() => ask(q), 50); };
  const yrs = m => m === Infinity ? 'Never at this payment' : m === 0 ? 'Debt-free' : fmtD(addM(m));
  const tabs = (state, list) => `<div class="seg" style="margin-bottom:22px">${list.map(([k, l]) => `<button class="${window[state] === k ? 'on' : ''}" onclick="${state}='${k}';render()">${l}</button>`).join('')}</div>`;
  const DEF_KEYS = [['home', 'Home value'], ['bal', 'Mortgage balance'], ['pmt', 'Mortgage payment'], ['income', 'Take-home pay'], ['cash', 'Cash savings'], ['tfsa', 'TFSA'], ['rrsp', 'RRSP'], ['maturity', 'Term end date']];
  const usingDefaults = () => DEF_KEYS.filter(([k]) => S[k] === DEF[k] && !(S.confirmed || []).includes(k) && (hasMortgage() || !['home', 'bal', 'pmt', 'maturity'].includes(k)));
  window.confirmDefaults = () => { S.confirmed = DEF_KEYS.map(k => k[0]); save(); render(); };

  /* 5. HOME - My Financial Life */
  function opportunities(m) {
    const out = [];
    if (m.unallocated < 0) out.push({ t: `Your plan is short ${$(-m.unallocated)} a month`, d: 'Income doesn\'t cover living costs, required debt payments and planned savings. Reduce lifestyle spending or lower planned savings until this is zero or positive.', kind: 'Calculated', go: "go('budget')", q: 'My budget is negative. Where could I realistically cut?' });
    const hi = (S.debts || []).filter(d => n(d.bal) > 0 && n(d.rate) >= 10).sort((a, b) => b.rate - a.rate)[0];
    if (hi && m.unallocated > 0) {
      const now = E.debtPlan(S.debts, 0), better = E.debtPlan(S.debts, m.unallocated, 'avalanche');
      out.push({ t: `Paying ${$(m.unallocated)}/mo extra toward ${esc(hi.name)} (${pct(hi.rate)}) could save about ${$(now.interest - better.interest)} in interest`, d: `All non-mortgage debts paid off ${yrs(better.months)} instead of ${yrs(now.months)}.`, kind: 'Calculated', go: "dTab='debts';go('debt')", q: `Should I put my extra money toward my ${hi.name} or invest it?` });
    }
    if (m.emergencyMonths < E.ASSUMPTIONS.emergencyMonths && m.essentialNeed > 0) {
      const gap = m.essentialNeed * 3 - n(S.cash);
      out.push({ t: `Your emergency savings cover about ${m.emergencyMonths.toFixed(1)} months of essential costs`, d: `A common target is 3 months (${$(m.essentialNeed * 3)}). You are ${$(gap)} short${m.unallocated > 0 ? `, about ${Math.ceil(gap / m.unallocated)} months at your current unallocated cash` : ''}.`, kind: 'Calculated', go: "go('goals')", q: 'How big should my emergency fund be for my situation?' });
    }
    const rm = renewalMonth();
    if (hasMortgage() && rm != null && rm <= 12) {
      const st = E.amortize({ ...mortgageParams(), maxMonths: rm + 1 });
      out.push({ t: `Your mortgage renews in about ${rm} months`, d: `At your assumed renewal rate of ${pct(S.renewRate, 2)}, the payment would be about ${$(st.finalPayment)}. Start comparing lenders 120 days before renewal.`, kind: 'Estimate', go: "go('debt')", q: 'Should I choose fixed or variable at renewal?' });
    }
    if (m.unallocated > 50 && !hi) {
      const g = E.grow(0, m.unallocated, S.ret, 120);
      out.push({ t: `Investing your ${$(m.unallocated)} unallocated cash monthly could grow to about ${$(g.value)} in 10 years`, d: `Assumes ${pct(S.ret)} a year, which isn't guaranteed. At ${pct(Math.max(S.ret - 3, 0))} it would be about ${$(E.grow(0, m.unallocated, Math.max(S.ret - 3, 0), 120).value)}. Compare this with paying down the mortgage under Investing.`, kind: 'Estimate', go: "go('wealth')", q: 'Should I invest my extra money or pay down my mortgage?' });
    }
    return out.slice(0, 3);
  }

  function projection(m, years = 10) {
    const home = k => m.home * Math.pow(1 + n(S.growth) / 100, k);
    const sv = S.budget.savings;
    const contrib = n(sv.tfsa) + n(sv.rrsp) + n(sv.fhsa) + n(sv.nonreg) + n(sv.other);
    const inv = E.grow(m.invest, contrib, S.ret, years * 12).path;
    const A = [], L = [], N = [];
    for (let k = 0; k <= years; k++) {
      const mort = m.mp.path[k] ?? (m.mp.months === Infinity ? m.mp.path.at(-1) : 0);
      const deb = m.dp.path[k] ?? (m.dp.months === Infinity ? m.dp.path.at(-1) : 0);
      const cash = n(S.cash) + n(sv.emergency) * 12 * k;
      A.push(home(k) + inv[k] + cash); L.push(mort + deb); N.push(A[k] - L[k]);
    }
    return { A, L, N };
  }

  V.home = () => {
    const m = model(), h = today.getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const opps = opportunities(m), defs = usingDefaults(), pj = projection(m);
    const gT = S.goals.reduce((s, g) => s + n(g.t), 0), gS = S.goals.reduce((s, g) => s + n(g.s), 0);
    const kpi = (l, v, hint, cls = '', q) => `<div class="card kpi"><div class="l">${l}${q ? askBtn(q) : ''}</div><div class="v ${cls}">${v}</div><div class="h">${hint}</div></div>`;
    return `${head(today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }), `${hi}${S.profile.name ? ', ' + esc(S.profile.name) : ''}.`, `Your financial life at a glance${S.profile.city ? ' · ' + esc(area()) : ''}.`)}
    ${S.migrationNotes?.length ? `<div class="note" style="margin-bottom:16px"><b>We upgraded your budget.</b> Nothing was deleted, and a backup of your old data is saved on this device.<ul class="small" style="margin:8px 0 0;padding-left:18px">${S.migrationNotes.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn ghost sm" style="margin-top:10px" onclick="S.migrationNotes=[];save();render()">Got it</button></div>` : ''}
    ${defs.length ? `<div class="note warnnote" style="margin-bottom:16px"><b>Some numbers are still example values:</b> ${defs.map(d => d[1]).join(', ')}. Results that use them are estimates. <a href="#" onclick="go('settings');return false">Update my numbers</a> · <a href="#" onclick="confirmDefaults();return false">These are correct</a></div>` : ''}
    <div class="grid g4">
      ${kpi('Net worth', $(m.net), `${$(m.assets)} assets − ${$(m.liab)} owed`, m.net < 0 ? 'neg' : '', 'Explain my net worth and how to grow it')}
      ${kpi('Monthly surplus', $(m.unallocated), 'After living costs, debts and savings', m.unallocated < 0 ? 'neg' : 'pos', 'How can I improve my monthly cash flow?')}
      ${kpi('Emergency fund', m.essentialNeed ? m.emergencyMonths.toFixed(1) + ' mo' : '—', `${$(S.cash)} cash · target 3 months`, m.emergencyMonths < 3 ? 'warn' : 'pos')}
      ${kpi('Debt-free', m.liab ? yrs(m.debtFree) : 'Debt-free', `${$(m.liab)} owed in total`, '', 'How could I become debt-free sooner?')}
    </div><div class="sp"></div>
    <div class="grid g4 mini">
      <div class="card flat kpi"><div class="l">Take-home income</div><div class="v">${$(m.income)}</div></div>
      <div class="card flat kpi"><div class="l">Living expenses</div><div class="v">${$(m.living)}</div></div>
      <div class="card flat kpi"><div class="l">Investments</div><div class="v">${$(m.invest)}</div></div>
      <div class="card flat kpi"><div class="l">Goals funded</div><div class="v">${gT ? pct(gS / gT * 100, 0) : '—'}</div></div>
    </div><div class="sp"></div>
    <div class="grid g21">
      <div class="card"><div class="head"><div><h2>Net worth projection</h2><div class="small mute">10 years · ${pct(S.ret)} investment return and ${pct(S.growth)} home growth assumed ${EST}</div></div>${askBtn('Explain my net worth projection chart')}</div>
        ${chart([{ n: 'Assets', c: 'var(--pos)', d: pj.A }, { n: 'Owed', c: 'var(--neg)', d: pj.L }, { n: 'Net worth', c: 'var(--accent)', d: pj.N.map(v => Math.max(v, 0)) }], 220)}
        <div class="small mute">In 10 years: net worth about <b>${$(pj.N[10])}</b>. Today's savings plan and minimum debt payments assumed.</div></div>
      <div class="card"><h2>Your financial opportunities</h2><div class="small mute" style="margin-bottom:6px">Up to three, from your own numbers</div>
        ${opps.length ? `<div class="list">${opps.map(o => `<div class="it opp"><div style="flex:1"><div class="row" style="gap:6px;margin-bottom:4px">${o.kind === 'Calculated' ? CALC : EST}</div><h3>${o.t}</h3><div class="small mute" style="margin-top:4px">${o.d}</div><div class="row" style="margin-top:8px"><button class="btn ghost sm" onclick="${o.go}">Open</button>${askBtn(o.q)}</div></div></div>`).join('')}</div>` : `<div class="small mute" style="padding:12px 0">No urgent items. Your cash flow, emergency fund and debts look on track.</div>`}
      </div>
    </div><div class="sp"></div>
    <div class="card"><div class="head"><h2>Market</h2><a href="#" onclick="go('market');return false">Rates & intelligence →</a></div>${rateStrip()}</div>
    <p class="foot">Figures marked Calculated come from EquityClimb's tested calculators using the numbers you entered. Estimates depend on assumptions you can change. This is general information, not financial advice.</p>`;
  };

  /* 6. BUDGET - five groups */
  const LABELS = {
    essentials: [['housing', 'Housing', 'Rent, property tax, condo fees. NOT your mortgage payment.'], ['groceries', 'Groceries'], ['utilities', 'Utilities', 'Power, heat, water, internet, phone'], ['insurance', 'Insurance', 'Home, auto, life'], ['transport', 'Transportation', 'Fuel, transit, parking, maintenance'], ['health', 'Healthcare'], ['other', 'Other necessities', 'Childcare, minimum clothing, etc.']],
    lifestyle: [['restaurants', 'Restaurants'], ['entertainment', 'Entertainment'], ['shopping', 'Shopping'], ['travel', 'Travel'], ['hobbies', 'Hobbies'], ['subscriptions', 'Subscriptions'], ['other', 'Other discretionary']],
    savings: [['emergency', 'Emergency savings'], ['tfsa', 'TFSA'], ['rrsp', 'RRSP'], ['fhsa', 'FHSA', 'First-time buyers only'], ['nonreg', 'Non-registered investing'], ['other', 'Other savings goals']]
  };
  window.payConv = () => { const a = +document.getElementById('pc-amt').value, f = document.getElementById('pc-f').value; if (a > 0) { set('income', Math.round(E.toMonthly(a, f) * 100) / 100); render(); } };
  const group = (title, total, sub, rows) => `<div class="card bgroup"><div class="head" style="margin-bottom:6px"><div><h2>${title}</h2><div class="small mute">${sub}</div></div><div class="gt">${$(total)}</div></div><table>${rows}</table></div>`;
  const row = (label, input, hint = '', badge = '') => `<tr><td>${label}${badge ? ' ' + badge : ''}${hint ? `<div class="small mute">${hint}</div>` : ''}</td><td>${input}</td></tr>`;
  V.budget = () => {
    const m = model(), B = S.budget;
    const inc = row('Employment (take-home)', money('income', S.income), 'After tax and deductions. Include everyone in the household.')
      + row('Business / self-employment', money('budget.income.business', B.income.business), 'After setting aside tax')
      + row('Rental income', `<span class="linked">${$(m.rentInc)}</span>`, S.rentOn === 'Yes' ? 'From your rental numbers, after vacancy' : 'Turn on under Settings → My numbers', tag('Linked'))
      + row('Other income', money('otherInc', S.otherInc));
    const grp = k => LABELS[k].map(([f, l, h]) => row(l, money(`budget.${k}.${f}`, B[k][f]), h || '')).join('')
      + (k === 'essentials' && m.rentalCosts ? row('Rental suite costs', `<span class="linked">${$(m.rentalCosts)}</span>`, 'From Settings → Rental suite', tag('Linked')) : '');
    const debtRows = (hasMortgage() ? row('Mortgage (principal + interest)', `<span class="linked">${$(S.pmt)}</span>`, 'Entered once under Debt & Mortgage. Don\'t add it to Housing.', tag('Linked')) : '')
      + (S.debts || []).map(d => row(esc(d.name), `<span class="linked">${$(d.min)}</span>`, `${pct(d.rate)} · minimum payment`, tag('Linked'))).join('')
      + `<tr><td colspan="2"><a href="#" onclick="dTab='debts';go('debt');return false">+ Add or edit debts</a></td></tr>`;
    return `${head('Budget & Cash Flow', 'Where your money goes', 'Five simple groups. Every dollar is counted once.')}
    <div class="formula card">
      <div><span>Income</span><b>${$(m.income)}</b></div><i>−</i>
      <div><span>Living</span><b>${$(m.living)}</b></div><i>−</i>
      <div><span>Debt payments</span><b>${$(m.debt)}</b></div><i>−</i>
      <div><span>Planned savings</span><b>${$(m.savings)}</b></div><i>=</i>
      <div class="res ${m.unallocated < 0 ? 'neg' : 'pos'}"><span>Unallocated</span><b>${$(m.unallocated)}</b></div>
      ${askBtn('Can you help me simplify my budget and save more each month?')}
    </div>
    ${m.unallocated < 0 ? `<div class="note warnnote" style="margin:14px 0"><b>Short ${$(-m.unallocated)} a month.</b> Lower lifestyle spending or planned savings first. Essentials and debt minimums are hard to change quickly.</div>` : ''}
    <div class="sp"></div>
    <div class="grid g2">
      <div>${group('1 · Income', m.income, 'Monthly, after tax', inc)}
        <div class="card flat payconv"><div class="small"><b>Paid weekly or every two weeks?</b> Enter one paycheque and we'll convert it to a monthly amount.</div>
        <div class="row" style="margin-top:8px"><input id="pc-amt" type="number" placeholder="Paycheque $" style="flex:1"><select id="pc-f" style="width:150px"><option>Biweekly</option><option>Weekly</option><option>Semi-monthly</option><option>Monthly</option></select><button class="btn ghost sm" onclick="payConv()">Use</button></div></div>
        <div class="sp"></div>${group('4 · Debt payments', m.debt, 'Required minimums. Linked to Debt & Mortgage.', debtRows)}</div>
      <div>${group('2 · Essential living', m.essentials, 'Costs you must pay', grp('essentials'))}<div class="sp"></div>
        ${group('3 · Lifestyle', m.lifestyle, 'Choices you can adjust', grp('lifestyle'))}<div class="sp"></div>
        ${group('5 · Savings & investments', m.savings, 'Money you keep. Not spending.', grp('savings'))}</div>
    </div>
    <p class="foot">Taxes are not entered separately because income is take-home. Mortgage interest and principal are counted together once under Debt payments. Transfers to TFSA, RRSP or FHSA are savings, not spending.</p>`;
  };

  /* 7. DEBT & MORTGAGE */
  window.dTab = window.dTab || 'mortgage';
  let dExtra = 200;
  window.setDExtra = v => { dExtra = +v || 0; render(); };
  window.addDebt = () => { S.debts.push({ name: 'Credit card', type: 'Credit card', bal: 0, rate: 19.99, min: 0 }); save(); render(); };
  const TYPES = ['Credit card', 'Car loan', 'Student loan', 'Personal loan', 'Line of credit', 'HELOC', 'Other'];
  function debtsTab() {
    const ds = S.debts || [], av = E.debtPlan(ds, dExtra, 'avalanche'), sn = E.debtPlan(ds, dExtra, 'snowball'), mn = E.debtPlan(ds, 0);
    const rows = ds.map((d, k) => `<tr><td><input style="width:100%;text-align:left" value="${esc(d.name)}" onchange="S.debts[${k}].name=this.value;save()"><select style="margin-top:6px" onchange="S.debts[${k}].type=this.value;save()">${TYPES.map(t => `<option ${t === d.type ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><input type="number" value="${n(d.bal)}" onchange="S.debts[${k}].bal=+this.value;save();later()"></td><td><input type="number" step="0.01" value="${n(d.rate)}" onchange="S.debts[${k}].rate=+this.value;save();later()"></td><td><input type="number" value="${n(d.min)}" onchange="S.debts[${k}].min=+this.value;save();later()"></td>
      <td><button class="btn ghost sm" onclick="S.debts.splice(${k},1);save();render()">×</button></td></tr>`).join('');
    return `<div class="card"><div class="head"><div><h2>Your other debts</h2><div class="small mute">Enter each one once. It also shows in your Budget, Home dashboard and Copilot.</div></div><button class="btn sm" onclick="addDebt()">+ Add debt</button></div>
      ${ds.length ? `<div class="table-scroll"><table><tr><th>Debt</th><th>Balance</th><th>Rate %</th><th>Min / mo</th><th></th></tr>${rows}</table></div>` : '<div class="small mute">No other debts added. Add credit cards, car loans, student loans or lines of credit.</div>'}
      ${av.warnings.length ? `<div class="note warnnote" style="margin-top:12px">${av.warnings.map(esc).join('<br>')}. The balance will grow unless you pay more.</div>` : ''}</div>
      ${ds.some(d => n(d.bal) > 0) ? `<div class="sp"></div><div class="card"><div class="head"><div><h2>Payoff strategies</h2><div class="small mute">Same monthly amount in every plan. Payments from a paid-off debt roll to the next.</div></div>${askBtn('Why does the avalanche method save more interest than snowball?')}</div>
      <label>Extra per month on top of minimums: <b>${$(dExtra)}</b></label><input type="range" min="0" max="2000" step="50" value="${dExtra}" onchange="setDExtra(this.value)" style="padding:0">
      <div class="table-scroll"><table style="margin-top:10px"><tr><th>Plan</th><th>Debt-free</th><th>Total interest</th><th>vs minimums</th></tr>
      <tr><td>Minimum payments only</td><td>${yrs(mn.months)}</td><td>${$(mn.interest)}</td><td class="mute">—</td></tr>
      <tr><td><b>Avalanche</b><div class="small mute">Highest rate first: ${av.order.map(esc).join(' → ')}</div></td><td>${yrs(av.months)}</td><td>${$(av.interest)}</td><td class="pos">${$(mn.interest - av.interest)} saved</td></tr>
      <tr><td><b>Snowball</b><div class="small mute">Smallest balance first: ${sn.order.map(esc).join(' → ')}</div></td><td>${yrs(sn.months)}</td><td>${$(sn.interest)}</td><td class="pos">${$(mn.interest - sn.interest)} saved</td></tr></table></div>
      <div class="hint">Avalanche usually costs the least. Snowball gives quicker wins, which helps some people stick with it. A lower monthly payment is not always the cheaper option overall.</div></div>` : ''}`;
  }
  const balAt = months => { const s = E.mortgageStepper(mortgageParams()); for (let k = 0; k < months && s.balance > 0; k++) s.step(0); return s.balance; };
  function mortgageTab() {
    if (!hasMortgage()) return `<div class="note">No mortgage on file. If you own a home, set <b>My situation</b> to "Owning" in Settings and add your mortgage numbers.</div>`;
    const m = model(), rm = renewalMonth(), st = rm != null ? E.amortize({ ...mortgageParams(), maxMonths: rm + 1 }) : null;
    const plus1 = E.amortize(mortgageParams(S.rate + 1)), cap = n(S.origP) * n(S.prepayPct) / 100;
    return `${m.mp.negativeAmortization ? `<div class="note warnnote" style="margin-bottom:16px"><b>Your payment doesn't cover the interest at ${pct(S.rate, 2)}.</b> Your rate may be past your trigger rate. Call your lender.</div>` : ''}
      ${P.mortgage()}<div class="sp"></div>
      <div class="grid g2"><div class="card"><div class="head"><div><h2>Renewal</h2><div class="small mute">Today's rate isn't assumed to last forever</div></div>${askBtn('What happens to my mortgage if rates rise at renewal?')}</div>
        <table><tr><td>Term ends</td><td>${fmtD(new Date(S.maturity))}${rm != null ? ` · in ${rm} mo` : ''}</td></tr>
        <tr><td>Balance at renewal</td><td>${rm != null ? $(balAt(rm)) : '—'}</td></tr>
        <tr><td>Payment at ${pct(S.renewRate, 2)} renewal rate</td><td><b>${st ? $(st.finalPayment) : '—'}</b></td></tr>
        <tr><td>Payment if renewal is 1 pt higher</td><td>${$(plus1.finalPayment)}</td></tr>
        <tr><td>Mortgage-free</td><td>${yrs(m.mp.months)}</td></tr></table>
        <div class="hint">At renewal, the payment is recalculated so the mortgage still finishes within the remaining amortization. It never goes below today's payment.</div></div>
      <div class="card"><h2>Mortgage details</h2>${Sel('compounding', 'Interest compounding', ['Semi-annual', 'Monthly'], 'Fixed-rate mortgages in Canada compound semi-annually. Many variable-rate mortgages compound monthly, so check your contract.')}
        ${F('renewRate', 'Assumed renewal rate (%)')}${F('prepayPct', 'Yearly prepayment limit (% of original amount)', `Your lump-sum limit is about ${$(cap)} a year`)}${F('maturity', 'Term ends', '', 'date')}
        <div class="hint">Balance, rate and payment are under Settings → My numbers.</div></div></div>`;
  }
  V.debt = () => `${head('Debt & Mortgage', 'What you owe, and the fastest way out', '')}${tabs('dTab', [['mortgage', 'Mortgage'], ['debts', `Other debts${(S.debts || []).length ? ' (' + S.debts.length + ')' : ''}`]])}${dTab === 'mortgage' ? mortgageTab() : debtsTab()}`;

  /* 8. INVESTING & WEALTH */
  window.wTab = window.wTab || 'strategy';
  function projectionTab() {
    const m = model(), sv = S.budget.savings, mo = n(sv.tfsa) + n(sv.rrsp) + n(sv.fhsa) + n(sv.nonreg) + n(sv.other), Y = Math.max(1, n(S.years)), M = Y * 12;
    const sc = [['Adverse', S.ret - 4, 'var(--neg)'], ['Conservative', S.ret - 2, 'var(--warn)'], ['Base case', S.ret, 'var(--accent)'], ['Optimistic', S.ret + 2, 'var(--pos)']].map(([l, r, c]) => ({ l, r, c, g: E.grow(m.invest, mo, r, M) }));
    const crash = E.grow(m.invest * 0.7, mo, S.ret, M);
    return `<div class="card"><div class="head"><div><h2>Your investments over ${Y} years</h2><div class="small mute">Starting ${$(m.invest)} · adding ${$(mo)}/mo from your budget's savings group</div></div>${askBtn('What happens if my investment returns are lower than expected?')}</div>
      <div class="grid g4" style="margin-bottom:12px">${sc.map(s => `<div class="kpi"><div class="l">${s.l} · ${pct(s.r)}/yr</div><div class="v" style="font-size:22px;color:${s.c}">${$(s.g.value)}</div></div>`).join('')}</div>
      ${chart(sc.map(s => ({ n: s.l, c: s.c, d: s.g.path.map(v => Math.max(v, 0)) })), 220)}
      <table style="margin-top:10px"><tr><td>Total you contribute</td><td>${$(sc[0].g.contributed)}</td></tr><tr><td>If markets fall 30% right now, then recover at base case</td><td>${$(crash.value)} <span class="mute">(${$(crash.value - sc[2].g.value)})</span></td></tr></table>
      <div class="hint">Returns are assumptions, not guarantees. Fees, taxes on non-registered accounts and inflation lower real results. Change the base return under Settings → My numbers.</div></div>`;
  }
  V.wealth = () => {
    const body = wTab === 'strategy' ? P.strategy() + (window._lastCompare?.prepay?.capped ? `<div class="note" style="margin-top:12px">Your extra payments are above your yearly prepayment limit (${pct(S.prepayPct, 0)} of the original amount). The extra is invested instead in the prepayment option.</div>` : '') : projectionTab();
    return `${head('Investing & Wealth', 'Grow what you keep', '')}${tabs('wTab', [['strategy', 'Pay down vs invest'], ['projection', 'Investment projection']])}${body}`;
  };

  /* 9. GOALS (goals + home buying) */
  window.gTab = window.gTab || 'goals';
  P.buy = () => {
    const b = S.buy, a = afford(), dp = b.down / b.price, L = b.price - b.down, prem = dp < .2 ? L * E.insurancePremium(dp) : 0, pm = E.payment(L + prem, b.rate, b.amort), md = E.minDownPayment(b.price);
    return `<div class="grid g2"><div class="card"><h2>Your situation</h2>
      ${F('buy.income', 'Household gross income / year')}${F('buy.down', 'Down payment saved')}${F('buy.debts', 'Other debt payments / month', 'Car, credit cards, loans')}
      <div class="grid g2" style="gap:12px"><div>${F('buy.tax', 'Property tax / month')}</div><div>${F('buy.heat', 'Heating / month')}</div></div>
      <div class="grid g2" style="gap:12px"><div>${F('buy.rate', 'Rate you expect (%)', 'From a lender quote')}</div><div>${Sel('buy.amort', 'Amortization (years)', [25, 30])}</div></div></div>
    <div class="card"><h2>What you can afford</h2>
      <div class="kpi" style="margin-top:10px"><div class="l">Estimated maximum price</div><div class="v acc" style="font-size:34px">${$(a.max)}</div><div class="h">Qualifying at ${pct(a.qual, 2)}: the higher of 5.25% or your rate + 2%</div></div>
      <div class="sp"></div>${F('buy.price', 'Home I\'m looking at')}
      <table style="margin-top:8px"><tr><td>Minimum down payment</td><td class="${b.down < md ? 'neg' : ''}">${$(md)}</td></tr><tr><td>Your down payment</td><td>${pct(dp * 100)}</td></tr>
      <tr><td>Mortgage default insurance</td><td>${prem ? $(prem) + ` (${(E.insurancePremium(dp) * 100).toFixed(1)}%)` : 'Not needed'}</td></tr>
      <tr><td>Payment at ${pct(b.rate, 2)}</td><td><b>${$(pm)}/mo</b></td></tr><tr><td>Within budget?</td><td>${b.price <= a.max ? tag('Yes', 'pos') : tag('Over by ' + $(b.price - a.max), 'neg')}</td></tr></table>
      <div class="hint">Debt limits 39% (housing) and 44% (total). Lenders vary, so get a pre-approval.</div></div></div>`;
  };
  function goalsWithCheck() {
    const m = model(), need = S.goals.reduce((s, g) => { const ml = Math.max(1, Math.round((new Date(g.d) - today) / 2.63e9)); return s + Math.max(n(g.t) - n(g.s), 0) / ml; }, 0);
    const avail = m.savings + Math.max(m.unallocated, 0);
    return `${need > avail ? `<div class="note warnnote" style="margin-bottom:16px"><b>Your goals need about ${$(need)}/mo, but you have ${$(avail)}/mo</b> (planned savings plus unallocated cash). Not all goals can be met on time. Push a date back or lower a target.</div>` : `<div class="note" style="margin-bottom:16px">Your goals need about ${$(need)}/mo and you have ${$(avail)}/mo available. ${CALC}</div>`}${P.goals()}`;
  }
  V.goals = () => `${head('Goals & Roadmap', 'What you\'re working toward', '')}${tabs('gTab', [['goals', 'My goals'], ['buy', 'Buying a home']])}${gTab === 'goals' ? goalsWithCheck() : P.buy()}`;

  /* 10. SETTINGS gets "My numbers" + assumptions */
  const oldSettings = V.settings;
  V.settings = () => `${oldSettings()}<div class="sp"></div>${head('My numbers', 'Entered once, used everywhere')}${P.numbers()}
    <div class="sp"></div><div class="grid g2"><div class="card"><h2>Rental suite</h2>${F('rentalExp', 'Rental operating costs / month', 'Share of utilities, insurance, repairs, maintenance')}${F('vacancy', 'Vacancy (%)')}</div>
    <div class="card"><h2>Planning assumptions <span class="tag">v${E.ASSUMPTIONS.version}</span></h2>${F('tfsaNew', 'New TFSA room each year', 'Check the current limit with CRA')}${F('rrspNew', 'New RRSP room each year', 'Shown on your Notice of Assessment')}
    <div class="hint">${E.ASSUMPTIONS.note} Stress test floor ${E.ASSUMPTIONS.stressFloor}%. Non-registered tax drag ${E.ASSUMPTIONS.nonRegTaxDrag}% a year.</div></div></div>`;

  /* 11. COPILOT gets calculated context (not guesses) */
  window.ask = async function (text) {
    const q = (text || document.getElementById('q')?.value || '').trim(); if (!q || busy) return;
    S.chat.push({ role: 'user', content: q }); busy = true; save(); render();
    let context = null;
    if (S.shareCtx) {
      const m = model();
      context = { note: 'Numbers under "calculated" come from EquityClimb tested calculators. Use them exactly; do not recompute or invent other figures. Say when information is missing.',
        location: area(), goal: GOALS[S.profile.goal].t,
        calculated: { monthlyIncome: Math.round(m.income), essentials: Math.round(m.essentials), lifestyle: Math.round(m.lifestyle), debtPayments: Math.round(m.debt), plannedSavings: Math.round(m.savings), unallocated: Math.round(m.unallocated),
          netWorth: Math.round(m.net), assets: Math.round(m.assets), owed: Math.round(m.liab), emergencyMonths: +m.emergencyMonths.toFixed(1),
          mortgageFree: hasMortgage() ? yrs(m.mp.months) : 'no mortgage', otherDebtsFree: yrs(m.dp.months) },
        mortgage: hasMortgage() ? { balance: S.bal, rate: S.rate + '% ' + S.rtype, compounding: S.compounding, payment: S.pmt, termEnds: S.maturity, assumedRenewalRate: S.renewRate } : null,
        debts: (S.debts || []).map(d => ({ name: d.name, balance: d.bal, rate: d.rate, min: d.min })),
        savings: { cash: S.cash, tfsa: S.tfsa, rrsp: S.rrsp, nonreg: S.nonreg, tfsaRoom: S.tfsaRoom, rrspRoom: S.rrspRoom }, marginalTax: S.mtr, assumedReturn: S.ret,
        defaultsStillInUse: usingDefaults().map(d => d[1]) };
    }
    const j = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'chat', messages: S.chat, context }) }).catch(() => ({ error: 'Network error' }));
    S.chat.push({ role: 'assistant', content: j.error ? '⚠ ' + j.error + ' Your calculators still work without the AI.' : j.text }); busy = false; save(); render();
  };

  /* 12. ONBOARDING (quick start) */
  const oldOnboard = V.onboard;
  V.onboard = () => {
    if (ob !== 3) return oldOnboard();
    const own = S.profile.goal === 'own' || S.profile.goal === 'invest';
    const dots = `<div class="dots">${[1, 2, 3].map(() => '<i class="on"></i>').join('')}</div>`;
    return `<div class="ob">${dots}${head('Step 3 of 3', 'Your quick numbers', 'Rough figures are fine. You can split them into categories later, and anything you skip is marked as an estimate.')}
      <div class="card">${F('income', 'Take-home pay / month (household)')}
      ${F('budget.essentials.other', 'Essential living costs / month', own ? 'Groceries, utilities, insurance, transport. Not your mortgage.' : 'Rent, groceries, utilities, insurance, transport')}
      ${F('budget.lifestyle.other', 'Everything else you spend / month', 'Eating out, shopping, subscriptions, travel')}
      ${F('cash', 'Cash savings')}
      ${own ? F('home', 'Home value (approx.)') + F('bal', 'Mortgage balance') + Sel('rtype', 'Rate type', ['Variable', 'Fixed']) + (S.rtype === 'Fixed' ? F('rate', 'Mortgage rate (%)') : F('adj', 'Your rate vs prime (pts)', 'e.g. −0.64 if prime minus 0.64%')) + F('pmt', 'Monthly mortgage payment') : F('buy.down', 'Savings for a down payment')}
      <div class="hint">Add credit cards and loans next under Debt & Mortgage.</div>
      <div class="row" style="margin-top:20px;justify-content:space-between"><button class="btn ghost" onclick="ob=2;render()">Back</button><button class="btn" onclick="finishOb()">See my financial overview</button></div></div></div>`;
  };
  window.finishOb = () => { S.profile.onboarded = true; S.rateMode = S.rtype === 'Variable' ? 'Live' : 'Manual'; S.compounding = S.rtype === 'Fixed' ? 'Semi-annual' : S.compounding; S.migrationNotes = []; save(); applyRates(); go('home'); };

  /* 13. NAVIGATION (6 areas) */
  I.debt = '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>';
  I.goal = '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>';
  I.wallet = '<path d="M4 7h14a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13.5" r="1.2"/>';
  I.more = '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>';
  const MAIN = [['home', 'Home', 'home'], ['budget', 'Budget', 'wallet'], ['debt', 'Debt & Mortgage', 'debt'], ['wealth', 'Investing', 'market'], ['goals', 'Goals', 'goal'], ['advisor', 'Copilot', 'ai']];
  const EXTRA = [['market', 'Market', 'market'], ['areas', 'Neighbourhoods', 'map'], ['settings', 'Settings', 'gear']];
  const MOBILE = [['home', 'Home', 'home'], ['budget', 'Budget', 'wallet'], ['debt', 'Debt', 'debt'], ['wealth', 'Invest', 'market'], ['advisor', 'Copilot', 'ai'], ['more', 'More', 'more']];
  const LEGACY = { overview: 'home', plan: 'budget' };
  V.more = () => `${head('More', 'Everything else')}<div class="list card">${[['goals', 'Goals & home buying', 'goal'], ...EXTRA].map(([k, l, i]) => `<div class="it" style="cursor:pointer;align-items:center" onclick="go('${k}')"><span class="moreic">${ic(i)}</span><h3 style="flex:1">${l}</h3><span class="mute">›</span></div>`).join('')}</div>`;
  const oldGo = go;
  window.go = (v, tab) => {
    v = LEGACY[v] || v;
    if (v === 'budget' && tab && tab !== 'budget') {
      if (tab === 'mortgage') { dTab = 'mortgage'; v = 'debt'; }
      else if (tab === 'strategy') v = 'wealth';
      else if (tab === 'goals' || tab === 'buy') { gTab = tab; v = 'goals'; }
      else if (tab === 'numbers') v = 'settings';
    }
    oldGo(v);
  };
  window.render = function () {
    if (LEGACY[cur]) cur = LEGACY[cur];
    if (!V[cur]) cur = 'home';
    const view = S.profile.onboarded ? cur : 'onboard';
    const btn = ([k, l, i]) => `<button class="nav ${k === view || (k === 'more' && ['goals', 'market', 'areas', 'settings', 'more'].includes(view)) ? 'on' : ''}" onclick="go('${k}')">${ic(i)}<span>${l}</span></button>`;
    document.getElementById('side').innerHTML = S.profile.onboarded ? `<div class="logo"><svg viewBox="0 0 32 32">${I.logo}</svg>EquityClimb</div>${MAIN.map(btn).join('')}<div class="navsep"></div>${EXTRA.map(btn).join('')}<div class="grow"></div>
      <div class="ratechip">${prime() ? `<span class="dot"></span>Prime rate<b>${pct(prime(), 2)}</b>` : '<span class="dot off"></span>Rates offline'}</div>` : '';
    document.getElementById('tabbar').innerHTML = S.profile.onboarded ? MOBILE.map(btn).join('') : '';
    const ae = document.activeElement, keep = ae && ae.id;
    document.getElementById('view').innerHTML = V[view]();
    if (keep && document.getElementById(keep)) document.getElementById(keep).focus();
  };

  /* start */
  migrate();
  const h = location.hash.slice(1); cur = LEGACY[h] || (V[h] && h !== 'onboard' ? h : 'home');
  render();
})();
