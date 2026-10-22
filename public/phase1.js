/* EquityClimb v6.1 - ONE file: styles + calculation engine + Canadian tax engine + screens + financial profile.
   index.html loads this file after app.js (script src="phase1.js"). */

/* ================= PART 1: STYLES (injected automatically) ================= */
(function () {
  if (document.querySelector('style[data-ec6]')) return;
  var css = `
.navsep{height:1px;background:var(--line);margin:12px 10px}
.side .nav{padding:9px 12px}
.ask-ai{display:inline-flex;align-items:center;gap:4px;margin-left:8px;border:1px solid var(--line2);background:transparent;color:var(--accent);border-radius:99px;padding:2px 8px 2px 6px;font-size:11px;font-weight:600;cursor:pointer;vertical-align:middle}
.ask-ai svg{width:12px;height:12px;stroke:currentColor}
.ask-ai:hover{background:var(--surface2)}
.kpi .l{display:flex;align-items:center;justify-content:space-between}
.grid.mini .kpi .v{font-size:20px}
.grid.mini .card{padding:14px 16px}
.warnnote{border-left-color:var(--warn)}
.opp h3{line-height:1.4}
.linked{display:inline-block;min-width:96px;text-align:right;color:var(--ink2);font-weight:600}
.formula{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.formula>div{display:flex;flex-direction:column;min-width:92px}
.formula span{font-size:11px;color:var(--mute);text-transform:uppercase;letter-spacing:.08em}
.formula b{font-size:20px;font-weight:600;margin-top:2px}
.formula i{font-style:normal;color:var(--mute);font-size:18px}
.formula .res b{font-size:24px}
.formula .res.pos b{color:var(--pos)}.formula .res.neg b{color:var(--neg)}
.bgroup .gt{font-size:20px;font-weight:600;color:var(--accent)}
.bgroup td{padding:9px 4px}
.payconv{margin-top:12px}
.moreic svg{width:20px;height:20px;stroke:var(--accent)}
.table-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
/* Financial profile */
.pf-q{margin-bottom:16px}
.pf-q>label{display:block;font-weight:600;margin-bottom:6px}
.pf-q .help{font-size:12.5px;color:var(--mute);margin-top:5px;line-height:1.45}
.pf-q input,.pf-q select{width:100%;box-sizing:border-box}
.pf-money{position:relative}.pf-money>span{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--mute);pointer-events:none}
.pf-money input{padding-left:24px}
.pf-pct{position:relative}.pf-pct>span{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--mute);pointer-events:none}
.pf-err{color:var(--neg);font-size:12.5px;margin-top:5px}
.pf-warn{color:var(--warn);font-size:12.5px;margin-top:5px}
.pf-yn{display:flex;gap:8px}.pf-yn button{flex:1}
.pf-result{background:var(--surface2);border:1px solid var(--line);border-radius:14px;padding:16px 18px}
.pf-result h3{margin:0 0 4px;font-size:15px}
.pf-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}
.pf-row:last-child{border-bottom:0}
.pf-row .k{color:var(--ink2);min-width:0}.pf-row .v{font-weight:600;white-space:nowrap;text-align:right}
.pf-row.total .k,.pf-row.total .v{font-weight:700;color:var(--ink)}
.pf-row.big .v{font-size:20px;color:var(--accent)}
.pf-row .minus{color:var(--neg)}
.badge{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:99px;margin-left:6px;vertical-align:middle;white-space:nowrap}
.badge.act{background:rgba(52,199,123,.14);color:var(--pos)}
.badge.est{background:rgba(232,176,64,.15);color:var(--warn)}
.badge.calc{background:rgba(120,150,255,.15);color:var(--accent)}
.badge.miss{background:rgba(230,90,90,.14);color:var(--neg)}
.info{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1px solid var(--line2);font-size:10px;font-weight:700;color:var(--mute);cursor:help;margin-left:6px;vertical-align:middle;font-style:normal}
.pf-steps{display:flex;gap:6px;overflow-x:auto;margin-bottom:20px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.pf-steps::-webkit-scrollbar{display:none}
.pf-steps button{flex:0 0 auto;border:1px solid var(--line2);background:transparent;color:var(--ink2);border-radius:99px;padding:8px 14px;font-weight:600;cursor:pointer;white-space:nowrap}
.pf-steps button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.pf-steps button .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--neg);margin-left:6px;vertical-align:middle}
.pf-nav{display:flex;justify-content:space-between;gap:10px;margin-top:18px}
.pf-cmp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.pf-cmp>div{border:1px solid var(--line);border-radius:12px;padding:12px}
.pf-cmp .l{font-size:12px;color:var(--mute)}.pf-cmp .v{font-size:20px;font-weight:700;margin-top:4px}
.pf-cmp .on{border-color:var(--accent)}
@media(max-width:700px){.v5-geo{grid-template-columns:repeat(5,minmax(0,1fr))!important}.v5-geo button{font-size:11px}}
@media(max-width:700px){
  .formula{gap:8px}.formula>div{min-width:calc(50% - 20px)}.formula i{display:none}
  .formula .res{min-width:100%;border-top:1px solid var(--line);padding-top:8px}
  .tabbar .nav span{font-size:9.5px}
  .bgroup td input{width:104px}
  .ask-ai span{display:none}.ask-ai{padding:3px 5px}
  .pf-cmp{grid-template-columns:1fr}
  .pf-row{flex-wrap:wrap}.pf-row .v{margin-left:auto}
  .pf-result{padding:14px}
  .pf-q input,.pf-q select{font-size:16px}
}`;
  var s = document.createElement('style'); s.setAttribute('data-ec6', ''); s.textContent = css; document.head.appendChild(s);
})();

/* ================= PART 2: CALCULATION ENGINE ================= */
(function (root) {
  'use strict';
  const ASSUMPTIONS = {
    version: '2026.1', effective: '2026-01-01',
    note: 'Defaults only. Confirm contribution room with CRA My Account and mortgage terms with your lender.',
    stressFloor: 5.25, stressBuffer: 2, gdsMax: 39, tdsMax: 44, nonRegTaxDrag: 0.6, emergencyMonths: 3
  };
  const num = v => (Number.isFinite(+v) ? +v : 0);
  function periodicRate(annualPct, compounding = 'Semi-annual', periodsPerYear = 12) {
    const r = num(annualPct) / 100; if (!r) return 0;
    const m = compounding === 'Monthly' ? 12 : compounding === 'Annual' ? 1 : 2;
    return Math.pow(1 + r / m, m / periodsPerYear) - 1;
  }
  function payment(principal, annualPct, years, compounding = 'Semi-annual', periodsPerYear = 12) {
    const P = num(principal), i = periodicRate(annualPct, compounding, periodsPerYear), n = Math.round(num(years) * periodsPerYear);
    if (P <= 0) return 0; if (n <= 0) return P;
    return i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n;
  }
  function monthsToRepay(balance, annualPct, pmt, compounding = 'Semi-annual') {
    const b = num(balance), i = periodicRate(annualPct, compounding), p = num(pmt);
    if (b <= 0) return 0; if (p <= 0) return Infinity; if (!i) return Math.ceil(b / p); if (p <= b * i) return Infinity;
    return Math.ceil(-Math.log(1 - b * i / p) / Math.log(1 + i));
  }
  function mortgageStepper(o) {
    let b = num(o.balance), i = periodicRate(o.rate, o.compounding), pay = num(o.payment), m = 0;
    const renewalMonth = o.renewalMonth == null ? null : Math.max(0, Math.round(o.renewalMonth));
    return {
      get balance() { return b; }, get payment() { return pay; }, get month() { return m; },
      step(extra = 0) {
        if (renewalMonth != null && m === renewalMonth && o.renewalRate != null && b > 0) {
          i = periodicRate(o.renewalRate, o.compounding);
          if (o.amortMonths) { const left = Math.max(o.amortMonths - m, 1); const need = i ? b * i / (1 - Math.pow(1 + i, -left)) : b / left; pay = Math.max(pay, need); }
        }
        let interest = 0, freed = 0, principal = 0;
        if (b > 0) { interest = b * i; const nb = b + interest - (pay + num(extra)); if (nb < 0) { freed = -nb; principal = b; b = 0; } else { principal = b - nb; b = nb; } }
        else freed = pay + num(extra);
        m++; return { interest, principal, freed };
      }
    };
  }
  function amortize(o) {
    const st = mortgageStepper(o), max = o.maxMonths || 600, lumpMonth = o.lumpMonth ?? 0;
    const lump = Math.min(num(o.lump), o.lumpCap == null ? Infinity : num(o.lumpCap));
    let interest = 0, firstPrincipal = null; const path = [st.balance];
    while (st.balance > 0.005 && st.month < max) {
      const r = st.step(num(o.extra) + (lump && st.month % 12 === lumpMonth ? lump : 0));
      interest += r.interest; if (firstPrincipal == null) firstPrincipal = r.principal;
      if (st.month % 12 === 0) path.push(st.balance);
      if (st.month === 1 && r.principal <= 0) break;
    }
    const done = st.balance <= 0.005; if (done && path[path.length - 1] !== 0) path.push(0);
    return { months: done ? st.month : Infinity, interest, path, finalPayment: st.payment, negativeAmortization: !done && (firstPrincipal || 0) <= 0 };
  }
  function debtPlan(debts, extra = 0, method = 'avalanche') {
    const ds = (debts || []).filter(d => num(d.bal) > 0).map(d => ({ name: d.name || 'Debt', b: num(d.bal), r: num(d.rate) / 1200, min: num(d.min), paid: null, int: 0 }));
    const order = [...ds].sort(method === 'snowball' ? (a, b) => a.b - b.b || b.r - a.r : (a, b) => b.r - a.r || a.b - b.b);
    const budget = ds.reduce((s, d) => s + d.min, 0) + Math.max(num(extra), 0);
    const warnings = ds.filter(d => d.min <= d.b * d.r).map(d => `${d.name}: minimum payment does not cover interest`);
    let m = 0, total = 0; const path = [ds.reduce((s, d) => s + d.b, 0)];
    while (ds.some(d => d.b > 0.005) && m < 600) {
      ds.forEach(d => { if (d.b > 0) { const ii = d.b * d.r; d.b += ii; d.int += ii; total += ii; } });
      let avail = budget;
      ds.forEach(d => { if (d.b > 0) { const p = Math.min(d.min, d.b, avail); d.b -= p; avail -= p; } });
      for (const d of order) { if (avail <= 0.005) break; if (d.b > 0) { const p = Math.min(avail, d.b); d.b -= p; avail -= p; } }
      m++; ds.forEach(d => { if (d.b <= 0.005 && d.paid == null) { d.b = 0; d.paid = m; } });
      if (m % 12 === 0) path.push(ds.reduce((s, d) => s + d.b, 0));
    }
    const ok = !ds.some(d => d.b > 0.005); if (ok && path[path.length - 1] !== 0) path.push(0);
    return { months: ok ? m : Infinity, interest: total, path, warnings, order: order.map(d => d.name) };
  }
  function grow(initial, monthly, annualPct, months, fee = 0) {
    const g = Math.pow(1 + (num(annualPct) - num(fee)) / 100, 1 / 12) - 1;
    let v = num(initial); const path = [v];
    for (let m = 1; m <= months; m++) { v = (v + num(monthly)) * (1 + g); if (m % 12 === 0) path.push(v); }
    return { value: v, path, contributed: num(initial) + num(monthly) * months };
  }
  function compareStrategies(p) {
    const N = Math.round(num(p.years) * 12), X = num(p.extra);
    const g = Math.pow(1 + num(p.ret) / 100, 1 / 12) - 1;
    const gN = Math.pow(1 + Math.max(num(p.ret) - ASSUMPTIONS.nonRegTaxDrag, 0) / 100, 1 / 12) - 1;
    const cap = (num(p.origP) || num(p.balance)) * num(p.prepayPct ?? 15) / 100, out = {};
    { const M = mortgageStepper(p); let nr = 0, used = 0, capped = false;
      for (let m = 0; m < N; m++) { if (m % 12 === 0) used = 0; const a = M.balance > 0 ? Math.max(0, Math.min(X, cap - used)) : 0; if (a < X && M.balance > 0) capped = true; used += a; const r = M.step(a); nr = (nr + r.freed + X - a) * (1 + gN); }
      out.prepay = { net: nr - M.balance, capped }; }
    { const M = mortgageStepper(p); let room = num(p.tfsaRoom), t = 0, nr = 0;
      for (let m = 0; m < N; m++) { if (m > 0 && m % 12 === 0) room += num(p.tfsaNew); const r = M.step(0), c = X + r.freed, a = Math.min(c, room); room -= a; t = (t + a) * (1 + g); nr = (nr + c - a) * (1 + gN); }
      out.tfsa = { net: t + nr - M.balance }; }
    { const M = mortgageStepper(p); let rr = num(p.rrspRoom), troom = num(p.tfsaRoom), r = 0, t = 0, nr = 0, yc = 0, pending = 0;
      for (let m = 0; m < N; m++) {
        if (m > 0 && m % 12 === 0) { rr += num(p.rrspNew); troom += num(p.tfsaNew); pending = yc; yc = 0; }
        let toT = 0, toN = 0;
        if (m % 12 === 3 && pending > 0) { const ref = pending * num(p.mtr) / 100, a = Math.min(ref, troom); troom -= a; toT += a; toN += ref - a; pending = 0; }
        const s = M.step(0), c = Math.min(X, rr); rr -= c; yc += c;
        const rest = X - c + s.freed, a = Math.min(rest, troom); troom -= a; toT += a; toN += rest - a;
        r = (r + c) * (1 + g); t = (t + toT) * (1 + g); nr = (nr + toN) * (1 + gN);
      }
      out.rrsp = { net: r * (1 - num(p.retTax) / 100) + t + nr - M.balance }; }
    return out;
  }
  function budgetTotals(b) {
    const sum = o => Object.values(o || {}).reduce((s, v) => s + num(v), 0);
    const income = sum(b.income), essentials = sum(b.essentials), lifestyle = sum(b.lifestyle), debt = sum(b.debt), savings = sum(b.savings);
    return { income, essentials, lifestyle, living: essentials + lifestyle, debt, savings, unallocated: income - essentials - lifestyle - debt - savings };
  }
  const toMonthly = (a, f) => num(a) * ({ Weekly: 52 / 12, Biweekly: 26 / 12, 'Semi-monthly': 2, Monthly: 1, Annual: 1 / 12 }[f] || 1);
  const minDownPayment = price => { const p = num(price); return p <= 500000 ? p * 0.05 : p < 1500000 ? 25000 + (p - 500000) * 0.10 : p * 0.20; };
  const insurancePremium = d => d >= 0.2 ? 0 : d >= 0.15 ? 0.028 : d >= 0.10 ? 0.031 : 0.04;
  const qualifyingRate = c => Math.max(ASSUMPTIONS.stressFloor, num(c) + ASSUMPTIONS.stressBuffer);
  root.ECEngine = { ASSUMPTIONS, periodicRate, payment, monthsToRepay, mortgageStepper, amortize, debtPlan, grow, compareStrategies, budgetTotals, toMonthly, minDownPayment, insurancePremium, qualifyingRate };
})(window);
/* ================= PART 3: CANADIAN TAX, PAYROLL & MORTGAGE-FREQUENCY ENGINE =================
   All yearly values live in TAX_TABLES, separate from the calculation logic.
   To add a new year: copy the latest year block, update the numbers, and set verified flags.
   Sources (2026): CRA "Current year tax rates and income brackets (2026)", CRA payroll tables,
   CRA CPP/CPP2 and EI rates. Items marked approx:true were not confirmed against CRA and should be checked. */
(function (root) {
  'use strict';
  const B = (pairs) => pairs.map(([upTo, rate]) => ({ upTo, rate }));
  const TAX_TABLES = {
    2026: {
      label: '2026',
      federal: {
        brackets: B([[58523, 0.14], [117045, 0.205], [181440, 0.26], [258482, 0.29], [Infinity, 0.33]]),
        bpaMax: 16452, bpaMin: 14829, bpaPhaseStart: 181440, bpaPhaseEnd: 258482,
        employmentAmount: 1501, // Canada employment amount (approx, indexed 2%)
        quebecAbatement: 0.165
      },
      cpp: { exemption: 3500, ympe: 74600, yampe: 85000, rate: 0.0595, baseRate: 0.0495, rate2: 0.04 },
      qpp: { exemption: 3500, ympe: 74600, yampe: 85000, rate: 0.064, baseRate: 0.054, rate2: 0.04, approx: true },
      ei: { mie: 68900, rate: 0.0163, rateQC: 0.0130 },
      qpip: { mie: 103000, rate: 0.00494, approx: true },
      provinces: {
        AB: { name: 'Alberta', bpa: 22769, brackets: B([[61200, 0.08], [154259, 0.10], [185111, 0.12], [246813, 0.13], [370220, 0.14], [Infinity, 0.15]]) },
        BC: { name: 'British Columbia', bpa: 13216, brackets: B([[50363, 0.056], [100728, 0.077], [115648, 0.105], [140430, 0.1229], [190405, 0.147], [265545, 0.168], [Infinity, 0.205]]) },
        MB: { name: 'Manitoba', bpa: 15780, brackets: B([[47564, 0.108], [101200, 0.1275], [Infinity, 0.174]]) },
        NB: { name: 'New Brunswick', bpa: 13664, approx: true, brackets: B([[52333, 0.094], [104666, 0.14], [193861, 0.16], [Infinity, 0.195]]) },
        NL: { name: 'Newfoundland and Labrador', bpa: 11188, approx: true, brackets: B([[44678, 0.087], [89354, 0.145], [159528, 0.158], [223340, 0.178], [285319, 0.198], [570638, 0.208], [1141275, 0.213], [Infinity, 0.218]]) },
        NS: { name: 'Nova Scotia', bpa: 11932, approx: true, brackets: B([[30995, 0.0879], [61991, 0.1495], [97417, 0.1667], [157124, 0.175], [Infinity, 0.21]]) },
        NT: { name: 'Northwest Territories', bpa: 18198, approx: true, brackets: B([[53003, 0.059], [106009, 0.086], [172346, 0.122], [Infinity, 0.1405]]) },
        NU: { name: 'Nunavut', bpa: 19659, approx: true, brackets: B([[55801, 0.04], [111602, 0.07], [181439, 0.09], [Infinity, 0.115]]) },
        ON: { name: 'Ontario', bpa: 12989, brackets: B([[53891, 0.0505], [107785, 0.0915], [150000, 0.1116], [220000, 0.1216], [Infinity, 0.1316]]),
              surtax: [{ over: 5818, rate: 0.20 }, { over: 7446, rate: 0.36 }], healthPremium: true },
        PE: { name: 'Prince Edward Island', bpa: 14650, approx: true, brackets: B([[33928, 0.095], [65820, 0.1347], [106890, 0.166], [142520, 0.1762], [200000, 0.19], [Infinity, 0.20]]) },
        QC: { name: 'Quebec', bpa: 18952, approx: true, noPayrollCredits: true, brackets: B([[54345, 0.14], [108680, 0.19], [132245, 0.24], [Infinity, 0.2575]]) },
        SK: { name: 'Saskatchewan', bpa: 20381, approx: true, brackets: B([[54532, 0.105], [155805, 0.125], [Infinity, 0.145]]) },
        YT: { name: 'Yukon', bpa: 16452, brackets: B([[58523, 0.064], [117045, 0.09], [181440, 0.109], [500000, 0.128], [Infinity, 0.15]]) }
      }
    }
  };

  const num = v => (Number.isFinite(+v) ? +v : 0);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  function tableFor(year) {
    const years = Object.keys(TAX_TABLES).map(Number).sort((a, b) => a - b);
    const pick = years.filter(y => y <= year).pop() ?? years[0];
    return { year: pick, t: TAX_TABLES[pick], outdated: pick < year };
  }
  function bracketTax(income, brackets) {
    let tax = 0, low = 0;
    for (const b of brackets) { if (income <= low) break; tax += (Math.min(income, b.upTo) - low) * b.rate; low = b.upTo; }
    return tax;
  }
  function ontarioHealthPremium(ti) {
    if (ti <= 20000) return 0;
    if (ti <= 36000) return Math.min(300, (ti - 20000) * 0.06);
    if (ti <= 48000) return Math.min(450, 300 + (ti - 36000) * 0.06);
    if (ti <= 72000) return Math.min(600, 450 + (ti - 48000) * 0.25);
    if (ti <= 200000) return Math.min(750, 600 + (ti - 72000) * 0.25);
    return Math.min(900, 750 + (ti - 200000) * 0.25);
  }

  /* Annual estimate for one person.
     employment = salary + bonus + other taxable employment income; otherTaxable = e.g. net rental income (no CPP/EI). */
  function payroll({ employment = 0, otherTaxable = 0, province = 'AB', year = new Date().getFullYear() }) {
    const { year: ty, t, outdated } = tableFor(year);
    const E = Math.max(num(employment), 0), O = num(otherTaxable);
    const P = t.provinces[province] || t.provinces.AB, qc = province === 'QC';
    const pen = qc ? t.qpp : t.cpp;
    const c1 = pen.rate * clamp(E - pen.exemption, 0, pen.ympe - pen.exemption);
    const c2 = pen.rate2 * clamp(E - pen.ympe, 0, pen.yampe - pen.ympe);
    const cppBase = c1 * pen.baseRate / pen.rate, cppEnhanced = c1 - cppBase + c2;
    const ei = (qc ? t.ei.rateQC : t.ei.rate) * Math.min(E, t.ei.mie);
    const qpip = qc ? t.qpip.rate * Math.min(E, t.qpip.mie) : 0;
    const taxable = Math.max(E + O - cppEnhanced, 0);

    const f = t.federal, low = f.brackets[0].rate;
    const bpa = taxable <= f.bpaPhaseStart ? f.bpaMax : taxable >= f.bpaPhaseEnd ? f.bpaMin
      : f.bpaMax - (f.bpaMax - f.bpaMin) * (taxable - f.bpaPhaseStart) / (f.bpaPhaseEnd - f.bpaPhaseStart);
    const fedCredits = low * (bpa + cppBase + ei + qpip + Math.min(f.employmentAmount, E));
    let fed = Math.max(bracketTax(taxable, f.brackets) - fedCredits, 0);
    if (qc) fed *= (1 - f.quebecAbatement);

    const plow = P.brackets[0].rate;
    const provCredits = plow * (P.bpa + (P.noPayrollCredits ? 0 : cppBase + ei));
    let prov = Math.max(bracketTax(taxable, P.brackets) - provCredits, 0);
    if (P.surtax) prov += P.surtax.reduce((s, x) => s + Math.max(prov - x.over, 0) * x.rate, 0);
    if (P.healthPremium) prov += ontarioHealthPremium(taxable);

    const cpp = c1 + c2, eiTotal = ei + qpip, incomeTax = fed + prov, total = incomeTax + cpp + eiTotal;
    const gross = E + Math.max(O, 0);
    return {
      year: ty, outdated, province, provinceName: P.name, approx: !!(P.approx || (qc && t.qpp.approx)),
      gross, employment: E, taxable, federal: fed, provincial: prov, incomeTax, cpp, ei: eiTotal, total,
      net: gross - total, netMonthly: (gross - total) / 12, effective: gross > 0 ? total / gross : 0,
      pensionLabel: qc ? 'QPP' : 'CPP', eiLabel: qc ? 'EI + QPIP' : 'EI'
    };
  }
  // Combined federal + provincial marginal income-tax rate (excludes CPP/EI).
  function marginalRate(args) {
    const a = payroll(args), b = payroll({ ...args, otherTaxable: num(args.otherTaxable) + 1000 });
    return (b.incomeTax - a.incomeTax) / 1000;
  }

  /* Canadian mortgage payments by frequency.
     Fixed: semi-annual compounding (Interest Act). Variable: per contract (usually monthly).
     Accelerated payments = monthly payment / 2 (bi-weekly) or / 4 (weekly). */
  const FREQ = {
    'Monthly': { n: 12 }, 'Semi-monthly': { n: 24 }, 'Bi-weekly': { n: 26 }, 'Accelerated bi-weekly': { n: 26, accel: 2 },
    'Weekly': { n: 52 }, 'Accelerated weekly': { n: 52, accel: 4 }
  };
  function mortgagePayment({ balance, rate, years, frequency = 'Monthly', compounding = 'Semi-annual' }) {
    const E = root.ECEngine, f = FREQ[frequency] || FREQ.Monthly, P = num(balance), Y = num(years);
    if (P <= 0 || Y <= 0) return { payment: 0, monthlyEquivalent: 0, periods: f.n };
    const pay = f.accel ? E.payment(P, rate, Y, compounding, 12) / f.accel : E.payment(P, rate, Y, compounding, f.n);
    return { payment: pay, monthlyEquivalent: pay * f.n / 12, periods: f.n };
  }
  const perYear = freq => (FREQ[freq] || FREQ.Monthly).n;

  root.ECTax = { TAX_TABLES, tableFor, payroll, marginalRate, mortgagePayment, FREQ, perYear,
    provinces: () => Object.entries(tableFor(new Date().getFullYear()).t.provinces).map(([k, v]) => [k, v.name]) };
})(window);
/* ================= PART 4: FINANCIAL PROFILE (income, tax, rental, mortgage) =================
   Stores new fields under S.fp and keeps the older fields (S.income, S.pmt, S.rent, S.mtr, S.maturity...)
   in sync so every existing calculator keeps working. Exposes window.ECP for the screens. */
(function () {
  'use strict';
  const E = window.ECEngine, T = window.ECTax;
  const fin = v => typeof v === 'number' && Number.isFinite(v);
  const n = v => (fin(+v) && v !== '' && v != null ? +v : 0);
  const has = v => v !== null && v !== undefined && v !== '' && fin(+v);
  const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

  /* ---------- dates ---------- */
  function validISO(s) {
    if (typeof s !== 'string') return false;
    const m = s.match(ISO); if (!m) return false;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1990 || y > 2100) return false;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  }
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const longDate = iso => validISO(iso) ? new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';
  const monthsUntil = iso => {
    if (!validISO(iso)) return null;
    const a = new Date(), b = new Date(iso + 'T12:00:00');
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0);
  };
  const countdown = iso => {
    const m = monthsUntil(iso); if (m == null) return '';
    if (iso < todayISO()) return 'already passed';
    if (m < 1) return 'this month';
    const y = Math.floor(m / 12), r = m % 12;
    return 'in ' + [y ? `${y} yr${y > 1 ? 's' : ''}` : '', r ? `${r} mo` : ''].filter(Boolean).join(' ');
  };

  /* ---------- defaults + migration of older saved data ---------- */
  const REGION = { alberta: 'AB', 'british columbia': 'BC', manitoba: 'MB', 'new brunswick': 'NB', 'newfoundland and labrador': 'NL', newfoundland: 'NL', 'nova scotia': 'NS', 'northwest territories': 'NT', nunavut: 'NU', ontario: 'ON', 'prince edward island': 'PE', quebec: 'QC', 'québec': 'QC', saskatchewan: 'SK', yukon: 'YT' };
  function ensure() {
    if (S.fp && S.fp.v >= 1) return;
    const legacyMat = S.maturity, D = typeof DEF !== 'undefined' ? DEF : {};
    const was = S.profile?.onboarded === true; // only an existing user's own numbers count as "actual"
    const own = k => was && has(S[k]) && n(S[k]) > 0 && S[k] !== D[k];
    const fp = {
      v: 1,
      income: { province: REGION[String(S.profile?.region || '').toLowerCase()] || (String(S.profile?.region || '').length === 2 ? String(S.profile.region).toUpperCase() : null),
        salary: null, bonus: null, otherEmp: null,
        actualNet: own('income') ? n(S.income) : null, // legacy "take-home / month" kept as ACTUAL
        useActual: true },
      rental: { has: S.rentOn === 'Yes' ? 'Yes' : (S.rentOn === 'No' ? 'No' : null), gross: has(S.rent) ? n(S.rent) : null, ownPct: 100,
        expenses: has(S.rentalExp) ? n(S.rentalExp) : null, actualNet: null },
      mort: { amortYears: null, freq: 'Monthly', actualPmt: own('pmt') ? n(S.pmt) : null, actualFreq: 'Monthly' },
      notes: []
    };
    if (has(S.bal) && n(S.bal) > 0 && fp.mort.actualPmt) {
      const mths = E.monthsToRepay(S.bal, S.rate, S.pmt, S.compounding || (S.rtype === 'Fixed' ? 'Semi-annual' : 'Monthly'));
      if (Number.isFinite(mths) && mths > 0) { fp.mort.amortYears = Math.round(mths / 12 * 10) / 10; fp.notes.push(`We estimated about ${fp.mort.amortYears} years left on your amortization from your payment and rate. Please check it against your mortgage statement under My profile → Mortgage.`); }
    }
    if (legacyMat != null && !validISO(legacyMat)) {
      S.maturity = null;
      fp.notes.push('Your saved mortgage term-end date was not a valid date, so it was cleared. Please pick it again under My profile → Mortgage.');
    }
    if (fp.income.actualNet) fp.notes.push('Your previous take-home pay was kept as your Actual take-home. Add your salary to also see EquityClimb\u2019s tax estimate.');
    S.fp = fp; save();
  }

  /* ---------- calculations ---------- */
  const year = () => new Date().getFullYear();
  function rentalCalc() {
    const r = S.fp.rental;
    if (r.has !== 'Yes') return { on: false, grossShare: 0, expShare: 0, netPreTax: 0, tax: 0, cash: 0, source: 'none' };
    const own = Math.min(Math.max(n(r.ownPct || 100), 0), 100) / 100;
    const grossShare = n(r.gross) * own, expShare = n(r.expenses) * own;
    const actual = has(r.actualNet);
    const netPreTax = actual ? n(r.actualNet) : grossShare - expShare;
    return { on: true, own, grossShare, expShare, netPreTax, actual, source: actual ? 'actual' : 'estimate' };
  }
  function incomeCalc() {
    const i = S.fp.income, prov = i.province || 'AB';
    const employment = n(i.salary) + n(i.bonus) + n(i.otherEmp);
    const rent = rentalCalc();
    const est = employment > 0 ? T.payroll({ employment, province: prov, year: year() }) : null;
    const withRent = employment > 0 || rent.netPreTax ? T.payroll({ employment, otherTaxable: rent.netPreTax, province: prov, year: year() }) : null;
    const rentalTax = rent.on && withRent ? Math.max(withRent.incomeTax - (est ? est.incomeTax : 0), 0) : 0;
    const marginal = employment > 0 || rent.netPreTax > 0 ? T.marginalRate({ employment, otherTaxable: rent.netPreTax, province: prov, year: year() }) : null;
    const useActual = has(i.actualNet) && !(i.useActual === false || i.useActual === 'false');
    const takeHome = useActual ? n(i.actualNet) : est ? est.netMonthly : 0;
    const source = useActual ? 'actual' : est ? 'estimate' : 'missing';
    // If actual take-home is used, rental tax is still estimated (it is not withheld from a paycheque).
    rent.tax = rentalTax / 12; rent.cash = rent.netPreTax - rent.tax;
    return { employment, est, marginal, takeHome, source, rent, province: prov };
  }
  function mortgageCalc() {
    const m = S.fp.mort, comp = S.rtype === 'Fixed' ? 'Semi-annual' : (S.compounding || 'Monthly');
    const est = has(S.bal) && n(S.bal) > 0 && has(m.amortYears) && n(m.amortYears) > 0
      ? T.mortgagePayment({ balance: S.bal, rate: n(S.rate), years: m.amortYears, frequency: m.freq, compounding: comp }) : null;
    const actual = has(m.actualPmt) && n(m.actualPmt) > 0, actualFreq = m.actualFreq || m.freq;
    const actualMonthly = actual ? n(m.actualPmt) * T.perYear(actualFreq) / 12 : null;
    const usedMonthly = actual ? actualMonthly : est ? est.monthlyEquivalent : 0;
    const interestMonthly = n(S.bal) * E.periodicRate(n(S.rate), comp, 12);
    return { est, actual, actualPmt: actual ? n(m.actualPmt) : null, actualFreq, freqMismatch: actual && actualFreq !== m.freq, actualMonthly, usedMonthly, freq: m.freq, comp,
      source: actual ? 'actual' : est ? 'estimate' : 'missing', belowInterest: usedMonthly > 0 && usedMonthly <= interestMonthly };
  }
  function missing() {
    const out = [], i = S.fp.income, mortOn = n(S.bal) > 0 && S.profile.goal !== 'rent' && S.profile.goal !== 'buy';
    if (!i.province) out.push(['income', 'Province or territory']);
    if (!(n(i.salary) > 0) && !has(i.actualNet)) out.push(['income', 'Annual salary']);
    if (!S.fp.rental.has) out.push(['rental', 'Rental income (yes or no)']);
    if (mortOn) {
      if (!has(S.fp.mort.amortYears)) out.push(['mortgage', 'Years left on amortization']);
      if (!validISO(S.maturity)) out.push(['mortgage', 'Mortgage term-end date']);
    }
    return out;
  }

  /* Keep older fields in step so the existing calculators read the right numbers. */
  function sync() {
    const ic = incomeCalc(), mc = mortgageCalc(), r = ic.rent;
    if (ic.source === 'actual' || ic.source === 'estimate') S.income = Math.round(ic.takeHome * 100) / 100;
    if (ic.marginal != null) S.mtr = Math.round(ic.marginal * 1000) / 10;
    if (mc.source !== 'missing') S.pmt = Math.round(mc.usedMonthly * 100) / 100;
    S.rentOn = r.on ? 'Yes' : 'No';
    if (r.on) { S.rent = Math.round(r.grossShare * 100) / 100; S.rentalExp = Math.round(r.expShare * 100) / 100; }
  }

  /* ---------- input handlers with validation ---------- */
  const errs = {};
  function path(p) { const k = p.split('.'); let o = S; while (k.length > 1) { const x = k.shift(); o[x] = o[x] ?? {}; o = o[x]; } return [o, k[0]]; }
  const get = p => { const [o, k] = path(p); return o[k]; };
  function setNum(p, raw, opt = {}) {
    const s = String(raw ?? '').replace(/[$,%\s]/g, '');
    delete errs[p];
    if (s === '') { const [o, k] = path(p); o[k] = opt.required ? o[k] : null; if (opt.required) errs[p] = 'This is required.'; }
    else {
      const v = Number(s);
      if (!Number.isFinite(v)) errs[p] = 'Please enter a number.';
      else if (opt.min != null && v < opt.min) errs[p] = opt.min === 0 ? 'This can\u2019t be negative.' : `Must be at least ${opt.min}.`;
      else if (opt.max != null && v > opt.max) errs[p] = `Must be ${opt.max} or less.`;
      else { const [o, k] = path(p); o[k] = v; if (p === 'fp.mort.actualPmt') S.fp.mort.actualFreq = S.fp.mort.freq; }
    }
    after(p);
  }
  function setVal(p, v) { const [o, k] = path(p); o[k] = v; after(p); }
  function setDate(p, v) {
    delete errs[p];
    if (!v) { const [o, k] = path(p); o[k] = null; }
    else if (!validISO(v)) errs[p] = 'Please choose a real date (four-digit year).';
    else { const [o, k] = path(p); o[k] = v; }
    after(p);
  }
  const RATE_PATHS = ['rtype', 'rateMode', 'adj', 'rate'];
  function after(p) {
    if (p === 'rtype') { S.compounding = S[p] === 'Fixed' ? 'Semi-annual' : 'Monthly'; if (S.rtype === 'Fixed') S.rateMode = 'Manual'; }
    if (RATE_PATHS.includes(p) && typeof applyRates === 'function') { try { applyRates(); } catch (e) {} }
    sync(); save(); render();
  }

  /* ---------- field builders ---------- */
  const esc2 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const idOf = p => 'pf_' + p.replace(/\W/g, '_');
  const errHtml = p => errs[p] ? `<div class="pf-err" role="alert">${errs[p]}</div>` : '';
  const optStr = o => JSON.stringify(o).replace(/"/g, '&quot;');
  function money(p, label, help = '', opt = { min: 0 }) {
    const v = get(p);
    return `<div class="pf-q"><label for="${idOf(p)}">${label}</label><div class="pf-money"><span>$</span><input id="${idOf(p)}" type="text" inputmode="decimal" autocomplete="off" value="${has(v) ? Number(v).toLocaleString('en-CA', { maximumFractionDigits: 2 }) : ''}" placeholder="${opt.placeholder || (opt.optional ? 'Optional' : '0')}" onchange="ECP.setNum('${p}', this.value, ${optStr(opt)})"></div>${help ? `<div class="help">${help}</div>` : ''}${errHtml(p)}</div>`;
  }
  function percent(p, label, help = '', opt = { min: 0, max: 100 }) {
    const v = get(p);
    return `<div class="pf-q"><label for="${idOf(p)}">${label}</label><div class="pf-pct"><input id="${idOf(p)}" type="text" inputmode="decimal" autocomplete="off" value="${has(v) ? v : ''}" placeholder="${opt.placeholder || ''}" onchange="ECP.setNum('${p}', this.value, ${optStr(opt)})"><span>%</span></div>${help ? `<div class="help">${help}</div>` : ''}${errHtml(p)}</div>`;
  }
  function plain(p, label, help = '', opt = { min: 0 }) {
    const v = get(p);
    return `<div class="pf-q"><label for="${idOf(p)}">${label}</label><input id="${idOf(p)}" type="text" inputmode="decimal" autocomplete="off" value="${has(v) ? v : ''}" placeholder="${opt.placeholder || ''}" onchange="ECP.setNum('${p}', this.value, ${optStr(opt)})">${help ? `<div class="help">${help}</div>` : ''}${errHtml(p)}</div>`;
  }
  function select(p, label, opts, help = '') {
    const v = get(p);
    return `<div class="pf-q"><label for="${idOf(p)}">${label}</label><select id="${idOf(p)}" onchange="ECP.setVal('${p}', this.value)">${v == null ? '<option value="" selected disabled>Choose…</option>' : ''}${opts.map(o => { const [val, txt] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc2(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc2(txt)}</option>`; }).join('')}</select>${help ? `<div class="help">${help}</div>` : ''}${errHtml(p)}</div>`;
  }
  function yesNo(p, label, help = '') {
    const v = get(p);
    return `<div class="pf-q"><label>${label}</label><div class="pf-yn" role="group">${['Yes', 'No'].map(x => `<button type="button" class="btn ${v === x ? '' : 'ghost'}" aria-pressed="${v === x}" onclick="ECP.setVal('${p}','${x}')">${x}</button>`).join('')}</div>${help ? `<div class="help">${help}</div>` : ''}</div>`;
  }
  function dateField(p, label, help = '') {
    const v = get(p), past = validISO(v) && v < todayISO();
    return `<div class="pf-q"><label for="${idOf(p)}">${label}</label><input id="${idOf(p)}" type="date" min="1990-01-01" max="2100-12-31" value="${validISO(v) ? v : ''}" onchange="ECP.setDate('${p}', this.value)">
      ${validISO(v) ? `<div class="help"><b>${longDate(v)}</b> · ${countdown(v)}</div>` : '<div class="help">Not set yet. It\u2019s on your mortgage renewal letter or lender statement.</div>'}
      ${past ? '<div class="pf-warn">This date has already passed. If you renewed, enter your new term-end date.</div>' : ''}${help ? `<div class="help">${help}</div>` : ''}${errHtml(p)}</div>`;
  }

  /* ---------- labels ---------- */
  const fmt = v => fin(v) ? (v < 0 ? '−$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-CA') : '—';
  const fmt2 = v => fin(v) ? (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  const pctf = v => fin(v) ? (v * 100).toFixed(1) + '%' : '—';
  const badge = k => ({ actual: '<span class="badge act">Actual</span>', estimate: '<span class="badge est">Estimated</span>', calc: '<span class="badge calc">Calculated by EquityClimb</span>', missing: '<span class="badge miss">Missing</span>', previous: '<span class="badge est">From older data</span>' }[k] || '');
  const info = t => `<i class="info" tabindex="0" title="${esc2(t)}" aria-label="${esc2(t)}">i</i>`;
  const row = (k, v, cls = '') => `<div class="pf-row ${cls}"><span class="k">${k}</span><span class="v">${v}</span></div>`;

  window.ECP = { ensure, sync, incomeCalc, mortgageCalc, rentalCalc, missing, validISO, longDate, countdown, monthsUntil, todayISO,
    setNum, setVal, setDate, money, percent, plain, select, yesNo, dateField, fmt, fmt2, pctf, badge, info, row, has };
})();
/* ================= PART 5: SCREENS ================= */
(() => {
  'use strict';
  const E = window.ECEngine, X = window.ECP;
  const n = v => (Number.isFinite(+v) ? +v : 0);

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
    S.prepayPct = S.prepayPct ?? 15; S.tfsaNew = S.tfsaNew ?? 7000; S.rrspNew = S.rrspNew ?? 0; S.rentalExp = S.rentalExp ?? 0;
    S.buy = S.buy || {}; S.buy.rate = S.buy.rate ?? 4.5;
    S.migrationNotes = notes; S.schema = 6; save();
  }

  const renewalMonth = () => X.monthsUntil(S.maturity) == null ? null : Math.max(0, X.monthsUntil(S.maturity));
  const mortgageParams = (rate = S.rate) => {
    const am = n(S.fp?.mort?.amortYears) > 0 ? Math.round(n(S.fp.mort.amortYears) * 12) : E.monthsToRepay(S.bal, S.rate, S.pmt, S.compounding);
    return { balance: n(S.bal), rate, payment: n(S.pmt), compounding: S.rtype === 'Fixed' ? 'Semi-annual' : S.compounding, renewalMonth: renewalMonth(), renewalRate: n(S.renewRate) + (rate - S.rate), amortMonths: Number.isFinite(am) && am > 0 ? am : 300 };
  };
  const debtBal = () => (S.debts || []).reduce((s, d) => s + n(d.bal), 0);
  const hasMortgage = () => n(S.bal) > 0 && S.profile.goal !== 'rent' && S.profile.goal !== 'buy';
  function model() {
    const B = S.budget, ic = X.incomeCalc(), mc = X.mortgageCalc();
    const debt = { mortgage: hasMortgage() ? mc.usedMonthly : 0 }; (S.debts || []).forEach((d, k) => debt['d' + k] = n(d.min));
    const t = E.budgetTotals({ income: { employment: ic.takeHome, business: B.income.business, rental: ic.rent.cash, other: S.otherInc }, essentials: B.essentials, lifestyle: B.lifestyle, debt, savings: B.savings });
    const invest = n(S.tfsa) + n(S.rrsp) + n(S.nonreg), home = hasMortgage() ? n(S.home) : 0, mort = hasMortgage() ? n(S.bal) : 0;
    const assets = home + n(S.cash) + invest, liab = mort + debtBal();
    const mp = hasMortgage() ? E.amortize(mortgageParams()) : { months: 0, path: [0], interest: 0 };
    const dp = E.debtPlan(S.debts, 0), essentialNeed = t.essentials + t.debt;
    return { ...t, ic, mc, rentInc: ic.rent.cash, invest, home, mort, assets, liab, net: assets - liab, mp, dp,
      emergencyMonths: essentialNeed > 0 ? n(S.cash) / essentialNeed : 0, essentialNeed, debtFree: Math.max(mp.months, dp.months) };
  }
  window.ECModel = model;

  window.amort = (bal, rate, pmt, extra = 0, lump = 0) => {
    const r = E.amortize({ ...mortgageParams(rate), balance: bal, payment: pmt, extra, lump, lumpMonth: 7, lumpCap: n(S.origP) * n(S.prepayPct) / 100 });
    return { months: r.months, int: r.interest, path: r.path };
  };
  window.unlock = (extra = 0, growth = S.growth) => {
    const st = E.mortgageStepper(mortgageParams()); let h = n(S.home);
    for (let m = 0; m < 480; m++) { if (st.balance <= 0.8 * h) return m; st.step(extra); h *= Math.pow(1 + growth / 100, 1 / 12); }
    return null;
  };
  window.rentNet = () => X.incomeCalc().rent.cash;
  window.compare = () => {
    const c = E.compareStrategies({ ...mortgageParams(), extra: S.extra, years: S.years, ret: S.ret, mtr: S.mtr, retTax: S.retTax, tfsaRoom: S.tfsaRoom, tfsaNew: S.tfsaNew, rrspRoom: S.rrspRoom, rrspNew: S.rrspNew, origP: S.origP, prepayPct: S.prepayPct });
    window._lastCompare = c; return { prepay: c.prepay.net, tfsa: c.tfsa.net, rrsp: c.rrsp.net };
  };
  window.afford = () => {
    const b = S.buy, qual = E.qualifyingRate(b.rate), inc = n(b.income) / 12;
    const maxP = Math.min(inc * 0.39 - b.heat - b.tax, inc * 0.44 - b.heat - b.tax - b.debts);
    const i = E.periodicRate(qual, 'Semi-annual'), N = b.amort * 12, loan = Math.max(maxP, 0) * (1 - Math.pow(1 + i, -N)) / i;
    let max = 0;
    for (let p = 100000; p < 4e6; p += 5000) { const d = Math.min(b.down, p); if (d < E.minDownPayment(p)) break; const L = p - d, prem = L / p > .8 ? L * E.insurancePremium(d / p) : 0; if (L + prem > loan) break; max = p; }
    return { qual, loan, max, maxP, minDown: E.minDownPayment };
  };

  const money = (path, val) => `<input type="number" inputmode="decimal" step="any" min="0" value="${n(val)}" onchange="set('${path}', Math.max(0, +this.value || 0)); later()">`;
  const tag = (t, cls = '') => `<span class="tag ${cls}">${t}</span>`;
  const CALC = tag('Calculated', 'acc'), EST = tag('Estimate', 'warn');
  const askBtn = q => `<button class="ask-ai" onclick='askAbout(${JSON.stringify(q).replace(/'/g, '&#39;')})' title="Ask Copilot about this">${ic('ai')}<span>Ask</span></button>`;
  window.askAbout = q => { go('advisor'); setTimeout(() => ask(q), 50); };
  const yrs = m => m === Infinity ? 'Never at this payment' : m === 0 ? 'Debt-free' : fmtD(addM(m));
  const tabs = (state, list) => `<div class="seg" style="margin-bottom:22px">${list.map(([k, l]) => `<button class="${window[state] === k ? 'on' : ''}" onclick="${state}='${k}';render()">${l}</button>`).join('')}</div>`;
  const DEF_KEYS = [['home', 'Home value'], ['bal', 'Mortgage balance'], ['cash', 'Cash savings'], ['tfsa', 'TFSA'], ['rrsp', 'RRSP']];
  const usingDefaults = () => DEF_KEYS.filter(([k]) => typeof DEF !== 'undefined' && S[k] === DEF[k] && !(S.confirmed || []).includes(k) && (hasMortgage() || !['home', 'bal'].includes(k)));
  window.confirmDefaults = () => { S.confirmed = DEF_KEYS.map(k => k[0]); save(); render(); };

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
      out.push({ t: `Your mortgage renews ${X.countdown(S.maturity)} (${X.longDate(S.maturity)})`, d: `At your assumed renewal rate of ${pct(S.renewRate, 2)}, the monthly payment would be about ${$(st.finalPayment)}. Start comparing lenders about 120 days before renewal.`, kind: 'Estimate', go: "go('debt')", q: 'Should I choose fixed or variable at renewal?' });
    }
    if (m.unallocated > 50 && !hi) {
      const g = E.grow(0, m.unallocated, S.ret, 120);
      out.push({ t: `Investing your ${$(m.unallocated)} unallocated cash monthly could grow to about ${$(g.value)} in 10 years`, d: `Assumes ${pct(S.ret)} a year, which isn't guaranteed. At ${pct(Math.max(S.ret - 3, 0))} it would be about ${$(E.grow(0, m.unallocated, Math.max(S.ret - 3, 0), 120).value)}.`, kind: 'Estimate', go: "go('wealth')", q: 'Should I invest my extra money or pay down my mortgage?' });
    }
    return out.slice(0, 3);
  }
  function projection(m, years = 10) {
    const sv = S.budget.savings, contrib = n(sv.tfsa) + n(sv.rrsp) + n(sv.fhsa) + n(sv.nonreg) + n(sv.other);
    const inv = E.grow(m.invest, contrib, S.ret, years * 12).path, A = [], L = [], N = [];
    for (let k = 0; k <= years; k++) {
      const mort = m.mp.path[k] ?? (m.mp.months === Infinity ? m.mp.path.at(-1) : 0);
      const deb = m.dp.path[k] ?? (m.dp.months === Infinity ? m.dp.path.at(-1) : 0);
      A.push(m.home * Math.pow(1 + n(S.growth) / 100, k) + inv[k] + n(S.cash) + n(sv.emergency) * 12 * k); L.push(mort + deb); N.push(A[k] - L[k]);
    }
    return { A, L, N };
  }

  V.home = () => {
    const m = model(), h = today.getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const opps = opportunities(m), defs = usingDefaults(), pj = projection(m), miss = X.missing();
    const gT = S.goals.reduce((s, g) => s + n(g.t), 0), gS = S.goals.reduce((s, g) => s + n(g.s), 0);
    const notes = [...(S.migrationNotes || []), ...(S.fp.notes || [])];
    const kpi = (l, v, hint, cls = '', q) => `<div class="card kpi"><div class="l">${l}${q ? askBtn(q) : ''}</div><div class="v ${cls}">${v}</div><div class="h">${hint}</div></div>`;
    return `${head(today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }), `${hi}${S.profile.name ? ', ' + esc(S.profile.name) : ''}.`, `Your financial life at a glance${S.profile.city ? ' · ' + esc(area()) : ''}.`)}
    ${notes.length ? `<div class="note" style="margin-bottom:16px"><b>We upgraded your profile.</b> Nothing was deleted, and a backup of your old data is saved on this device.<ul class="small" style="margin:8px 0 0;padding-left:18px">${notes.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn ghost sm" style="margin-top:10px" onclick="S.migrationNotes=[];S.fp.notes=[];save();render()">Got it</button></div>` : ''}
    ${miss.length ? `<div class="note warnnote" style="margin-bottom:16px"><b>Finish your profile for accurate numbers:</b> ${miss.map(x => esc(x[1])).join(', ')}. <a href="#" onclick="pfStep='${miss[0][0]}';go('profile');return false">Complete it →</a></div>` : ''}
    ${defs.length ? `<div class="note warnnote" style="margin-bottom:16px"><b>Some numbers are still example values:</b> ${defs.map(d => d[1]).join(', ')}. <a href="#" onclick="pfStep='savings';go('profile');return false">Update</a> · <a href="#" onclick="confirmDefaults();return false">These are correct</a></div>` : ''}
    <div class="grid g4">
      ${kpi('Net worth', $(m.net), `${$(m.assets)} assets − ${$(m.liab)} owed`, m.net < 0 ? 'neg' : '', 'Explain my net worth and how to grow it')}
      ${kpi('Monthly surplus', $(m.unallocated), 'After living costs, debts and savings', m.unallocated < 0 ? 'neg' : 'pos', 'How can I improve my monthly cash flow?')}
      ${kpi('Emergency fund', m.essentialNeed ? m.emergencyMonths.toFixed(1) + ' mo' : '—', `${$(S.cash)} cash · target 3 months`, m.emergencyMonths < 3 ? 'warn' : 'pos')}
      ${kpi('Debt-free', m.liab ? yrs(m.debtFree) : 'Debt-free', `${$(m.liab)} owed in total`, '', 'How could I become debt-free sooner?')}
    </div><div class="sp"></div>
    <div class="grid g4 mini">
      <div class="card flat kpi"><div class="l">Take-home income ${X.badge(m.ic.source)}</div><div class="v">${$(m.ic.takeHome)}</div></div>
      <div class="card flat kpi"><div class="l">Living expenses</div><div class="v">${$(m.living)}</div></div>
      <div class="card flat kpi"><div class="l">Mortgage renews</div><div class="v" style="font-size:16px">${hasMortgage() ? X.longDate(S.maturity) : '—'}</div></div>
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
    <p class="foot">Figures marked Calculated come from EquityClimb's calculators using the numbers you entered. Estimates depend on assumptions you can change. This is general information, not financial advice.</p>`;
  };

  /* ---------- BUDGET ---------- */
  const LABELS = {
    essentials: [['housing', 'Housing costs', 'Property tax, condo fees, home insurance or rent. NOT your mortgage payment.'], ['groceries', 'Groceries'], ['utilities', 'Utilities', 'Power, heat, water, internet, phone'], ['insurance', 'Other insurance', 'Auto, life'], ['transport', 'Transportation', 'Fuel, transit, parking, maintenance'], ['health', 'Healthcare'], ['other', 'Other necessities', 'Childcare, minimum clothing, etc.']],
    lifestyle: [['restaurants', 'Restaurants'], ['entertainment', 'Entertainment'], ['shopping', 'Shopping'], ['travel', 'Travel'], ['hobbies', 'Hobbies'], ['subscriptions', 'Subscriptions'], ['other', 'Other discretionary']],
    savings: [['emergency', 'Emergency savings'], ['tfsa', 'TFSA'], ['rrsp', 'RRSP'], ['fhsa', 'FHSA', 'First-time buyers only'], ['nonreg', 'Non-registered investing'], ['other', 'Other savings goals']]
  };
  const group = (title, total, sub, rows) => `<div class="card bgroup"><div class="head" style="margin-bottom:6px"><div><h2>${title}</h2><div class="small mute">${sub}</div></div><div class="gt">${$(total)}</div></div><table>${rows}</table></div>`;
  const row = (label, input, hint = '', badge = '') => `<tr><td>${label}${badge ? ' ' + badge : ''}${hint ? `<div class="small mute">${hint}</div>` : ''}</td><td>${input}</td></tr>`;
  const linked = v => `<span class="linked">${$(v)}</span>`;
  V.budget = () => {
    const m = model(), B = S.budget, ic = m.ic;
    const inc = row('Employment take-home', linked(ic.takeHome), ic.source === 'missing' ? 'Add your salary under My profile' : ic.source === 'actual' ? 'Your actual pay from My profile' : `Estimated from your salary after tax, ${ic.est?.pensionLabel || 'CPP'} and EI`, X.badge(ic.source))
      + row('Business / self-employment', money('budget.income.business', B.income.business), 'After setting aside tax')
      + row('Rental income (after costs & est. tax)', linked(ic.rent.cash), ic.rent.on ? 'From My profile → Rental' : 'No rental income', ic.rent.on ? X.badge(ic.rent.source) : '')
      + row('Other income', money('otherInc', S.otherInc)) + `<tr><td colspan="2"><a href="#" onclick="pfStep='income';go('profile');return false">Edit income in My profile →</a></td></tr>`;
    const grp = k => LABELS[k].map(([f, l, h]) => row(l, money(`budget.${k}.${f}`, B[k][f]), h || '')).join('');
    const debtRows = (hasMortgage() ? row('Mortgage (monthly equivalent)', linked(m.mc.usedMonthly), `${m.mc.source === 'actual' ? 'Your actual' : 'Estimated'} ${m.mc.freq.toLowerCase()} payment, converted to monthly. Counted once.`, X.badge(m.mc.source)) : '')
      + (S.debts || []).map(d => row(esc(d.name), linked(d.min), `${pct(d.rate)} · minimum payment`, tag('Linked'))).join('')
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
    ${m.unallocated < 0 ? `<div class="note warnnote" style="margin:14px 0"><b>Short ${$(-m.unallocated)} a month.</b> Lower lifestyle spending or planned savings first.</div>` : ''}
    <div class="sp"></div>
    <div class="grid g2">
      <div>${group('1 · Income', m.income, 'Monthly, after tax', inc)}
        <div class="sp"></div>${group('4 · Debt payments', m.debt, 'Required payments. Linked to My profile and Debt & Mortgage.', debtRows)}</div>
      <div>${group('2 · Essential living', m.essentials, 'Costs you must pay', grp('essentials'))}<div class="sp"></div>
        ${group('3 · Lifestyle', m.lifestyle, 'Choices you can adjust', grp('lifestyle'))}<div class="sp"></div>
        ${group('5 · Savings & investments', m.savings, 'Money you keep. Not spending.', grp('savings'))}</div>
    </div>
    <p class="foot">Income is after tax, so taxes are not subtracted again. The mortgage is counted once under Debt payments. Rental income is shown after your share of expenses and estimated tax. Transfers to TFSA, RRSP or FHSA are savings, not spending.</p>`;
  };

  /* ---------- DEBT & MORTGAGE ---------- */
  window.dTab = window.dTab || 'mortgage';
  let dExtra = 200;
  window.setDExtra = v => { dExtra = Math.max(0, +v || 0); render(); };
  window.addDebt = () => { S.debts.push({ name: 'Credit card', type: 'Credit card', bal: 0, rate: 19.99, min: 0 }); save(); render(); };
  window.setDebt = (k, f, v) => { S.debts[k][f] = f === 'name' || f === 'type' ? v : Math.max(0, +v || 0); save(); later(); };
  const TYPES = ['Credit card', 'Car loan', 'Student loan', 'Personal loan', 'Line of credit', 'HELOC', 'Other'];
  function debtsTab() {
    const ds = S.debts || [], av = E.debtPlan(ds, dExtra, 'avalanche'), sn = E.debtPlan(ds, dExtra, 'snowball'), mn = E.debtPlan(ds, 0);
    const rows = ds.map((d, k) => `<tr><td><input style="width:100%;text-align:left" value="${esc(d.name)}" onchange="setDebt(${k},'name',this.value)"><select style="margin-top:6px" onchange="setDebt(${k},'type',this.value)">${TYPES.map(t => `<option ${t === d.type ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><input type="number" min="0" value="${n(d.bal)}" onchange="setDebt(${k},'bal',this.value)"></td><td><input type="number" min="0" step="0.01" value="${n(d.rate)}" onchange="setDebt(${k},'rate',this.value)"></td><td><input type="number" min="0" value="${n(d.min)}" onchange="setDebt(${k},'min',this.value)"></td>
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
      <div class="hint">Avalanche usually costs the least. Snowball gives quicker wins. A lower monthly payment is not always the cheaper option overall.</div></div>` : ''}`;
  }
  const balAt = months => { const s = E.mortgageStepper(mortgageParams()); for (let k = 0; k < months && s.balance > 0; k++) s.step(0); return s.balance; };
  function mortgageTab() {
    if (!hasMortgage()) return `<div class="note">No mortgage on file. Add it under <a href="#" onclick="pfStep='mortgage';go('profile');return false">My profile → Mortgage</a>.</div>`;
    const m = model(), rm = renewalMonth(), st = rm != null ? E.amortize({ ...mortgageParams(), maxMonths: rm + 1 }) : null;
    const plus1 = rm != null ? E.amortize({ ...mortgageParams(), renewalRate: n(S.renewRate) + 1, maxMonths: rm + 1 }) : null, cap = n(S.origP) * n(S.prepayPct) / 100;
    return `${m.mc.belowInterest ? `<div class="note warnnote" style="margin-bottom:16px"><b>Your payment doesn't cover the interest at ${pct(S.rate, 2)}.</b> Your rate may be past your trigger rate. Call your lender.</div>` : ''}
      ${P.mortgage()}<div class="sp"></div>
      <div class="grid g2"><div class="card"><div class="head"><div><h2>Renewal</h2><div class="small mute">Today's rate isn't assumed to last forever</div></div>${askBtn('What happens to my mortgage if rates rise at renewal?')}</div>
        ${rm == null ? `<div class="note warnnote">Add your term-end date to see renewal numbers.</div>` : ''}
        <table><tr><td>Term ends</td><td>${X.longDate(S.maturity)}${rm != null ? ` · ${X.countdown(S.maturity)}` : ''}</td></tr>
        <tr><td>Balance at renewal ${EST}</td><td>${rm != null ? $(balAt(rm)) : '—'}</td></tr>
        <tr><td>Monthly payment at ${pct(S.renewRate, 2)} renewal rate</td><td><b>${st ? $(st.finalPayment) : '—'}</b></td></tr>
        <tr><td>If renewal is 1 point higher</td><td>${plus1 ? $(plus1.finalPayment) : '—'}</td></tr>
        <tr><td>Mortgage-free</td><td>${yrs(m.mp.months)}</td></tr></table>
        <div class="hint">At renewal, the payment is recalculated so the mortgage still finishes within your remaining amortization. It never goes below today's payment.</div></div>
      <div class="card"><h2>Renewal & prepayment</h2>
        ${X.dateField('maturity', 'When does your current mortgage term end / renew?')}
        ${X.percent('renewRate', 'Rate you expect at renewal', 'Unknown until renewal, so try a higher number too.', { min: 0, max: 25 })}
        ${X.percent('prepayPct', 'Yearly lump-sum prepayment limit', `% of the original amount. Your limit is about ${$(cap)} a year. Many BMO mortgages allow 20%.`, { min: 0, max: 100 })}
        <div class="hint">Balance, rate, amortization and payment are under <a href="#" onclick="pfStep='mortgage';go('profile');return false">My profile → Mortgage</a>.</div></div></div>`;
  }
  V.debt = () => `${head('Debt & Mortgage', 'What you owe, and the fastest way out', '')}${tabs('dTab', [['mortgage', 'Mortgage'], ['debts', `Other debts${(S.debts || []).length ? ' (' + S.debts.length + ')' : ''}`]])}${dTab === 'mortgage' ? mortgageTab() : debtsTab()}`;

  /* ---------- INVESTING ---------- */
  window.wTab = window.wTab || 'strategy';
  function projectionTab() {
    const m = model(), sv = S.budget.savings, mo = n(sv.tfsa) + n(sv.rrsp) + n(sv.fhsa) + n(sv.nonreg) + n(sv.other), Y = Math.max(1, n(S.years)), M = Y * 12;
    const sc = [['Adverse', S.ret - 4, 'var(--neg)'], ['Conservative', S.ret - 2, 'var(--warn)'], ['Base case', S.ret, 'var(--accent)'], ['Optimistic', S.ret + 2, 'var(--pos)']].map(([l, r, c]) => ({ l, r, c, g: E.grow(m.invest, mo, r, M) }));
    const crash = E.grow(m.invest * 0.7, mo, S.ret, M);
    return `<div class="card"><div class="head"><div><h2>Your investments over ${Y} years</h2><div class="small mute">Starting ${$(m.invest)} · adding ${$(mo)}/mo from your budget's savings group</div></div>${askBtn('What happens if my investment returns are lower than expected?')}</div>
      <div class="grid g4" style="margin-bottom:12px">${sc.map(s => `<div class="kpi"><div class="l">${s.l} · ${pct(s.r)}/yr</div><div class="v" style="font-size:22px;color:${s.c}">${$(s.g.value)}</div></div>`).join('')}</div>
      ${chart(sc.map(s => ({ n: s.l, c: s.c, d: s.g.path.map(v => Math.max(v, 0)) })), 220)}
      <table style="margin-top:10px"><tr><td>Total you contribute</td><td>${$(sc[0].g.contributed)}</td></tr><tr><td>If markets fall 30% right now, then recover at base case</td><td>${$(crash.value)} <span class="mute">(${$(crash.value - sc[2].g.value)})</span></td></tr></table>
      <div class="hint">Returns are assumptions, not guarantees. Fees, taxes and inflation lower real results.</div></div>`;
  }
  V.wealth = () => {
    const body = wTab === 'strategy' ? P.strategy() + (window._lastCompare?.prepay?.capped ? `<div class="note" style="margin-top:12px">Your extra payments are above your yearly prepayment limit (${pct(S.prepayPct, 0)} of the original amount). The extra is invested instead.</div>` : '') : projectionTab();
    return `${head('Investing & Wealth', 'Grow what you keep', `RRSP comparisons use your estimated marginal tax rate of ${pct(S.mtr)} from My profile.`)}${tabs('wTab', [['strategy', 'Pay down vs invest'], ['projection', 'Investment projection']])}${body}`;
  };

  /* ---------- GOALS ---------- */
  window.gTab = window.gTab || 'goals';
  P.buy = () => {
    const b = S.buy, a = afford(), dp = n(b.price) > 0 ? b.down / b.price : 0, L = b.price - b.down, prem = dp < .2 ? L * E.insurancePremium(dp) : 0, pm = E.payment(L + prem, b.rate, b.amort), md = E.minDownPayment(b.price);
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
    const m = model(), need = S.goals.reduce((s, g) => { const ml = Math.max(1, Math.round((new Date(g.d) - today) / 2.63e9) || 1); return s + Math.max(n(g.t) - n(g.s), 0) / ml; }, 0);
    const avail = m.savings + Math.max(m.unallocated, 0);
    return `${need > avail ? `<div class="note warnnote" style="margin-bottom:16px"><b>Your goals need about ${$(need)}/mo, but you have ${$(avail)}/mo</b> (planned savings plus unallocated cash). Not all goals can be met on time.</div>` : `<div class="note" style="margin-bottom:16px">Your goals need about ${$(need)}/mo and you have ${$(avail)}/mo available. ${CALC}</div>`}${P.goals()}`;
  }
  V.goals = () => `${head('Goals & Roadmap', 'What you\'re working toward', '')}${tabs('gTab', [['goals', 'My goals'], ['buy', 'Buying a home']])}${gTab === 'goals' ? goalsWithCheck() : P.buy()}`;

  /* ---------- MY PROFILE ---------- */
  window.pfStep = window.pfStep || 'income';
  const STEPS = [['income', 'Income & taxes'], ['rental', 'Rental income'], ['mortgage', 'Mortgage'], ['savings', 'Home & savings'], ['cashflow', 'Monthly cash flow']];
  function incomeStep() {
    const ic = X.incomeCalc(), i = S.fp.income, r = ic.est, has = X.has, usingActual = ic.source === 'actual';
    const results = r ? `<div class="pf-result"><h3>Taxes & take-home pay ${X.badge('estimate')}</h3><div class="small mute" style="margin-bottom:6px">${esc(r.provinceName)} · ${r.year} tax tables</div>
        ${X.row('Gross employment income / yr', X.fmt(r.employment))}
        ${X.row('Federal income tax' + X.info('Progressive federal brackets, less the basic personal amount, CPP, EI and Canada employment credits.'), '<span class="minus">−' + X.fmt(r.federal).replace('$', '$') + '</span>')}
        ${X.row(`${esc(r.provinceName)} income tax` + X.info('Provincial brackets, less the provincial basic personal amount and payroll credits. Ontario includes surtax and Health Premium.'), '<span class="minus">−' + X.fmt(r.provincial) + '</span>')}
        ${X.row(r.pensionLabel + X.info('Includes the second tier (CPP2) on earnings above the first ceiling.'), '<span class="minus">−' + X.fmt(r.cpp) + '</span>')}
        ${X.row(r.eiLabel, '<span class="minus">−' + X.fmt(r.ei) + '</span>')}
        ${X.row('Total deductions', '<span class="minus">−' + X.fmt(r.total) + '</span>', 'total')}
        ${X.row('Take-home / year', X.fmt(r.net), 'total')}
        ${X.row('Take-home / month', X.fmt(r.netMonthly), 'big')}
        ${X.row('Share of pay going to deductions' + X.info('Total tax, CPP/QPP and EI divided by gross employment income.'), X.pctf(r.effective))}
        ${X.row('Tax on your next dollar' + X.info('Combined federal + provincial marginal income-tax rate. Used for RRSP refund estimates.'), X.pctf(ic.marginal))}
      </div>
      ${has(i.actualNet) ? `<div class="pf-cmp"><div class="${usingActual ? 'on' : ''}"><div class="l">Actual take-home / month ${X.badge('actual')}</div><div class="v">${X.fmt(i.actualNet)}</div></div><div class="${!usingActual ? 'on' : ''}"><div class="l">EquityClimb estimate ${X.badge('estimate')}</div><div class="v">${X.fmt(r.netMonthly)}</div></div></div>
        <div class="small mute" style="margin-top:8px">Your budget uses the <b>${usingActual ? 'actual' : 'estimated'}</b> figure.</div>` : ''}
      <div class="hint">${r.outdated ? `<b>Using ${r.year} tables</b> because ${new Date().getFullYear()} values aren't loaded yet. ` : ''}${r.approx ? 'Some values for this province are approximate. ' : ''}Estimate assumes basic credits only. Real paycheques also include things like pension, benefits, union dues or RRSP deductions.</div>`
      : `<div class="pf-result"><h3>Taxes & take-home pay</h3><div class="small mute">Enter your salary and province and EquityClimb will estimate your taxes, ${i.province === 'QC' ? 'QPP' : 'CPP'}, EI and take-home pay.</div></div>`;
    return `<div class="grid g2"><div class="card"><h2>Income</h2>
      ${X.select('fp.income.province', 'Which province or territory do you live in?', window.ECTax.provinces())}
      ${X.money('fp.income.salary', 'What is your annual salary before tax?', 'Your gross base salary, <b>before</b> tax or deductions. Example: 85,000. Include a partner\u2019s salary only if you plan as a household.')}
      ${X.money('fp.income.bonus', 'What annual bonus do you expect?', 'Before tax. Leave blank if none.', { min: 0, optional: true })}
      ${X.money('fp.income.otherEmp', 'Other taxable employment income', 'Overtime, commissions or taxable benefits, per year. Optional.', { min: 0, optional: true })}
      <div class="sp"></div><h2 style="font-size:16px">Know your actual take-home pay?</h2>
      ${X.money('fp.income.actualNet', 'Actual take-home pay per month (optional)', 'From your pay stub or bank deposits. If you enter it, we keep it and show it next to our estimate.', { min: 0, optional: true })}
      ${has(i.actualNet) && ic.est ? `<div class="pf-q"><label for="pf_use">Which figure should your budget use?</label><select id="pf_use" onchange="ECP.setVal('fp.income.useActual', this.value === 'true')"><option value="true" ${usingActual ? 'selected' : ''}>My actual take-home</option><option value="false" ${!usingActual ? 'selected' : ''}>EquityClimb estimate</option></select></div>` : ''}
    </div><div>${results}</div></div>`;
  }
  function rentalStep() {
    const rc = X.incomeCalc().rent, r = S.fp.rental;
    return `<div class="grid g2"><div class="card"><h2>Rental income</h2>
      ${X.yesNo('fp.rental.has', 'Do you currently receive rental income?', 'For example a basement suite or a rental property.')}
      ${r.has === 'Yes' ? `
        ${X.money('fp.rental.gross', 'Gross rent received per month', 'Total rent before any expenses, for the whole unit or property.', { min: 0 })}
        ${X.percent('fp.rental.ownPct', 'Your ownership share', 'Use 100% if you own it alone, 50% if owned equally with someone outside this plan.', { min: 0, max: 100, placeholder: '100' })}
        ${X.money('fp.rental.expenses', 'Monthly rental expenses (optional)', 'For the whole property: extra utilities, insurance, repairs, management, property tax share. Leave the mortgage out; it\u2019s counted separately.', { min: 0, optional: true })}
        ${X.money('fp.rental.actualNet', 'Actual net rental income per month (optional)', 'Your share, after expenses, before income tax. If entered, it replaces the calculation.', { optional: true })}
        ${X.percent('suiteShare', 'If the rental is part of your home: share of the home rented', 'Used for the Smith-style interest deductibility comparisons only.', { min: 0, max: 100 })}` : r.has === 'No' ? '<div class="small mute">No rental income will be included.</div>' : ''}
    </div><div>${rc.on ? `<div class="pf-result"><h3>Rental income</h3>
        ${X.row('Gross rent (your share)', X.fmt2(rc.grossShare))}
        ${rc.actual ? '' : X.row('Expenses (your share)', '<span class="minus">−' + X.fmt2(rc.expShare) + '</span>')}
        ${X.row('Net rental income, before tax ' + X.badge(rc.source), X.fmt2(rc.netPreTax), 'total')}
        ${X.row('Estimated income tax on rental' + X.info('Net rent is added to your taxable income; this is the extra tax at your rates. Not withheld from a paycheque.'), '<span class="minus">−' + X.fmt2(rc.tax) + '</span>')}
        ${X.row('Rental cash added to your budget', X.fmt2(rc.cash), 'big')}
      </div><div class="hint">Gross rent is never treated as spendable on its own. Only the after-expense, after-tax amount is added to your monthly cash flow.</div>` : ''}</div></div>`;
  }
  function mortgageStep() {
    const mc = X.mortgageCalc(), own = S.profile.goal !== 'rent' && S.profile.goal !== 'buy', m = S.fp.mort;
    if (!own) return `<div class="note">Your situation is set to ${S.profile.goal === 'rent' ? 'renting' : 'buying'}, so no current mortgage is included. Change <b>My situation</b> in Settings if you own a home.</div>`;
    const live = S.rtype !== 'Fixed' && S.rateMode === 'Live';
    return `<div class="grid g2"><div class="card"><h2>Mortgage</h2>
      ${X.money('bal', 'What is your current mortgage balance?', 'From your latest lender statement or online banking.', { min: 0 })}
      ${X.select('rtype', 'Is your rate fixed or variable?', ['Fixed', 'Variable'])}
      ${S.rtype !== 'Fixed' ? X.select('rateMode', 'Keep your rate in step with prime?', [['Live', 'Yes, follow prime automatically'], ['Manual', 'No, I\u2019ll enter my rate']]) : ''}
      ${live ? X.plain('adj', 'Your rate compared with prime (points)', `Example: −0.64 if your rate is prime minus 0.64%. Your rate today: <b>${pct(S.rate, 2)}</b>.`, { min: -5, max: 5 })
             : X.percent('rate', 'What is your mortgage interest rate?', 'Example: 4.39', { min: 0, max: 25 })}
      ${X.plain('fp.mort.amortYears', 'How many years are left on your amortization?', 'The time to pay the whole mortgage off, not the term. Example: 24.5. It\u2019s on your annual statement.', { min: 0.1, max: 40 })}
      ${X.select('fp.mort.freq', 'How often do you pay?', Object.keys(window.ECTax.FREQ))}
      ${X.dateField('maturity', 'When does your current mortgage term end / renew?')}
      ${X.money('fp.mort.actualPmt', `What is your actual ${(mc.actual ? mc.actualFreq : m.freq).toLowerCase()} payment? (optional)`, 'Principal + interest only. Leave out property tax collected with the payment.', { min: 0, optional: true })}
    </div><div><div class="pf-result"><h3>Mortgage payment</h3>
      ${mc.est ? X.row(`Estimated ${mc.freq.toLowerCase()} payment ${X.badge('estimate')}` + X.info(`Canadian method: ${mc.comp === 'Semi-annual' ? 'fixed-rate interest compounds twice a year' : 'variable-rate interest compounds monthly'}. Accelerated payments are your monthly payment divided by 2 or 4.`), X.fmt2(mc.est.payment), mc.actual ? '' : 'big') : X.row('Estimated payment', 'Add balance, rate and amortization')}
      ${mc.actual ? X.row(`Actual ${mc.actualFreq.toLowerCase()} payment ${X.badge('actual')}`, X.fmt2(mc.actualPmt), 'big') : ''}
      ${X.row('Payment frequency', esc(mc.freq))}
      ${X.row('Used in your budget (monthly equivalent)' + X.info('Payment × payments per year ÷ 12.'), X.fmt2(mc.usedMonthly), 'total')}
      ${X.row('Term ends', `${X.longDate(S.maturity)}${X.validISO(S.maturity) ? ' · ' + X.countdown(S.maturity) : ''}`)}
    </div>
    ${mc.freqMismatch ? `<div class="note warnnote" style="margin-top:12px">Your actual payment was entered as <b>${esc(mc.actualFreq.toLowerCase())}</b>. If you now pay ${esc(mc.freq.toLowerCase())}, update the actual payment above. Until then we use your ${esc(mc.actualFreq.toLowerCase())} amount.</div>` : ''}
    ${mc.actual && mc.est && !mc.freqMismatch && Math.abs(mc.actualPmt - mc.est.payment) / mc.est.payment > 0.05 ? `<div class="note" style="margin-top:12px">Your actual payment differs from our estimate by more than 5%. That's normal if your rate changed, you pay extra, or your amortization differs. We use your <b>actual</b> payment.</div>` : ''}
    ${mc.belowInterest ? `<div class="note warnnote" style="margin-top:12px">This payment doesn't cover the monthly interest. Check your rate and payment with your lender.</div>` : ''}
    </div></div>`;
  }
  function savingsStep() {
    return `<div class="grid g2"><div class="card"><h2>Home</h2>
      ${X.money('home', 'Estimated home value today', 'A recent appraisal, city assessment or comparable sales.', { min: 0 })}
      ${X.percent('growth', 'Expected home price growth per year', 'Long-run assumption. Lower is more conservative.', { min: -10, max: 15 })}
      ${X.money('origP', 'Original mortgage amount', 'Used for your yearly prepayment limit.', { min: 0 })}
      ${S.rtype !== 'Fixed' ? X.percent('trigger', 'Trigger rate', 'Listed in your variable-rate mortgage documents.', { min: 0, max: 25 }) : ''}
    </div><div class="card"><h2>Savings & investments</h2>
      ${X.money('cash', 'Cash savings', 'Chequing, savings and emergency fund.', { min: 0 })}
      ${X.money('tfsa', 'TFSA balance', '', { min: 0 })}${X.money('rrsp', 'RRSP balance', '', { min: 0 })}${X.money('nonreg', 'Non-registered investments', '', { min: 0 })}
      ${X.money('tfsaRoom', 'Unused TFSA room', 'From CRA My Account.', { min: 0 })}${X.money('rrspRoom', 'Unused RRSP room', 'From your Notice of Assessment.', { min: 0 })}
      ${X.percent('ret', 'Expected investment return per year', 'Not guaranteed. 5–6% is a common long-run planning figure for a balanced portfolio.', { min: -10, max: 15 })}
      ${X.percent('retTax', 'Expected tax rate in retirement', '', { min: 0, max: 60 })}
    </div></div>`;
  }
  function cashflowStep() {
    const m = model(), ic = m.ic, i = S.fp.income, r = ic.rent, est = ic.est, mo = v => X.fmt(v / 12);
    const grossEmp = ic.employment / 12, useAct = ic.source === 'actual';
    const essentialsNoHousing = m.essentials - n(S.budget.essentials.housing);
    const otherDebt = m.debt - (hasMortgage() ? m.mc.usedMonthly : 0);
    return `<div class="card" style="max-width:720px"><div class="head"><div><h2>Your monthly cash flow</h2><div class="small mute">How your income turns into money left over. Each item is counted once.</div></div>${askBtn('Explain my monthly cash flow and how to improve it')}</div>
      ${ic.employment > 0 ? X.row('Salary', X.fmt(n(i.salary) / 12)) + (n(i.bonus) ? X.row('Bonus (spread over 12 months)', X.fmt(n(i.bonus) / 12)) : '') + (n(i.otherEmp) ? X.row('Other taxable employment income', X.fmt(n(i.otherEmp) / 12)) : '') : ''}
      ${r.on ? (r.actual ? X.row(`Rental income, net of expenses ${X.badge('actual')}`, X.fmt(r.netPreTax)) : X.row('Rental income (your share, gross)', X.fmt(r.grossShare))) : ''}
      ${ic.employment > 0 || r.on ? X.row('Gross household income', X.fmt(grossEmp + (r.actual ? r.netPreTax : r.grossShare)), 'total') : ''}
      ${ic.employment === 0 && ic.takeHome > 0 ? X.row(`Take-home pay ${X.badge(ic.source)}`, X.fmt(ic.takeHome)) : ''}
      ${ic.employment > 0 && !useAct && est ? X.row(`Income tax ${X.badge('estimate')}`, '<span class="minus">−' + mo(est.incomeTax) + '</span>') + X.row(est.pensionLabel + ' ' + X.badge('estimate'), '<span class="minus">−' + mo(est.cpp) + '</span>') + X.row(est.eiLabel + ' ' + X.badge('estimate'), '<span class="minus">−' + mo(est.ei) + '</span>') : ''}
      ${useAct && ic.employment > 0 ? X.row(`Paycheque deductions ${X.badge('actual')}` + X.info('You entered your actual take-home pay, so taxes are already taken off and are not subtracted again.'), '<span class="minus">−' + X.fmt(grossEmp - ic.takeHome) + '</span>') : ''}
      ${r.on ? (r.actual ? '' : X.row('Rental expenses (your share)', '<span class="minus">−' + X.fmt(r.expShare) + '</span>')) + X.row(`Tax on rental income ${X.badge('estimate')}`, '<span class="minus">−' + X.fmt(r.tax) + '</span>') : ''}
      ${n(S.budget.income.business) + n(S.otherInc) ? X.row('Business & other income (after tax)', X.fmt(n(S.budget.income.business) + n(S.otherInc))) : ''}
      ${X.row('Take-home cash', X.fmt(m.income), 'total')}
      ${hasMortgage() ? X.row(`Mortgage payment ${X.badge(m.mc.source)}`, '<span class="minus">−' + X.fmt(m.mc.usedMonthly) + '</span>') : ''}
      ${X.row('Housing costs (property tax, condo fees, insurance)', '<span class="minus">−' + X.fmt(S.budget.essentials.housing) + '</span>')}
      ${X.row('Other essentials', '<span class="minus">−' + X.fmt(essentialsNoHousing) + '</span>')}
      ${X.row('Lifestyle spending', '<span class="minus">−' + X.fmt(m.lifestyle) + '</span>')}
      ${otherDebt ? X.row('Other debt payments', '<span class="minus">−' + X.fmt(otherDebt) + '</span>') : ''}
      ${X.row('Planned savings', '<span class="minus">−' + X.fmt(m.savings) + '</span>')}
      ${X.row(`Remaining each month ${X.badge('calc')}`, `<span class="${m.unallocated < 0 ? 'neg' : ''}">${X.fmt(m.unallocated)}</span>`, 'big')}
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" onclick="go('budget')">Edit spending in Budget</button></div>
      <div class="hint">Taxes are only subtracted when EquityClimb estimates your take-home. If you entered your actual take-home, they're already out. Rental income counts once, after your share of expenses and estimated tax.</div></div>`;
  }
  V.profile = () => {
    const miss = X.missing(), missSteps = new Set(miss.map(x => x[0]));
    const idx = STEPS.findIndex(s => s[0] === pfStep), prev = STEPS[idx - 1], next = STEPS[idx + 1];
    const body = { income: incomeStep, rental: rentalStep, mortgage: mortgageStep, savings: savingsStep, cashflow: cashflowStep }[pfStep] || incomeStep;
    return `${head('My profile', 'Your financial picture', 'Answer simple questions. EquityClimb works out taxes, payments and cash flow for you.')}
      <div class="pf-steps" role="tablist">${STEPS.map(([k, l]) => `<button role="tab" aria-selected="${k === pfStep}" class="${k === pfStep ? 'on' : ''}" onclick="pfStep='${k}';render()">${l}${missSteps.has(k) ? '<span class="dot" aria-label="needs info"></span>' : ''}</button>`).join('')}</div>
      ${body()}
      <div class="pf-nav">${prev ? `<button class="btn ghost" onclick="pfStep='${prev[0]}';render();scrollTo(0,0)">← ${prev[1]}</button>` : '<span></span>'}${next ? `<button class="btn" onclick="pfStep='${next[0]}';render();scrollTo(0,0)">${next[1]} →</button>` : `<button class="btn" onclick="go('home')">Done</button>`}</div>`;
  };

  /* ---------- SETTINGS ---------- */
  const oldSettings = V.settings;
  V.settings = () => `${oldSettings()}<div class="sp"></div>
    <div class="card"><div class="head"><div><h2>My financial numbers</h2><div class="small mute">Income, taxes, rental, mortgage, home and savings now live in My profile.</div></div><button class="btn sm" onclick="go('profile')">Open My profile</button></div></div>
    <div class="sp"></div><div class="card"><h2>Planning assumptions <span class="tag">v${E.ASSUMPTIONS.version}</span></h2>
    ${X.money('tfsaNew', 'New TFSA room each year', 'Check the current limit with CRA', { min: 0 })}${X.money('rrspNew', 'New RRSP room each year', 'Shown on your Notice of Assessment', { min: 0 })}
    <div class="hint">${E.ASSUMPTIONS.note} Tax tables loaded: ${Object.keys(window.ECTax.TAX_TABLES).join(', ')}.</div></div>`;

  /* ---------- COPILOT ---------- */
  window.ask = async function (text) {
    const q = (text || document.getElementById('q')?.value || '').trim(); if (!q || busy) return;
    S.chat.push({ role: 'user', content: q }); busy = true; save(); render();
    let context = null;
    if (S.shareCtx) {
      const m = model(), est = m.ic.est;
      context = { note: 'Numbers under "calculated" come from EquityClimb calculators. Use them exactly; do not recompute or invent other figures. Values marked estimate are estimates. Say when information is missing.',
        location: area(), goal: GOALS[S.profile.goal].t,
        calculated: { takeHomeMonthly: Math.round(m.ic.takeHome), takeHomeSource: m.ic.source, rentalCashMonthly: Math.round(m.ic.rent.cash), essentials: Math.round(m.essentials), lifestyle: Math.round(m.lifestyle), debtPayments: Math.round(m.debt), plannedSavings: Math.round(m.savings), unallocated: Math.round(m.unallocated),
          netWorth: Math.round(m.net), assets: Math.round(m.assets), owed: Math.round(m.liab), emergencyMonths: +m.emergencyMonths.toFixed(1),
          mortgageFree: hasMortgage() ? yrs(m.mp.months) : 'no mortgage', otherDebtsFree: yrs(m.dp.months) },
        taxEstimate: est ? { province: est.provinceName, year: est.year, grossEmployment: Math.round(est.employment), incomeTax: Math.round(est.incomeTax), cppOrQpp: Math.round(est.cpp), ei: Math.round(est.ei), effectiveRate: +(est.effective * 100).toFixed(1), marginalRate: S.mtr } : null,
        mortgage: hasMortgage() ? { balance: S.bal, rate: S.rate + '% ' + S.rtype, frequency: m.mc.freq, paymentUsedMonthly: Math.round(m.mc.usedMonthly), paymentSource: m.mc.source, amortizationYearsLeft: S.fp.mort.amortYears, termEnds: X.validISO(S.maturity) ? S.maturity : 'missing', assumedRenewalRate: S.renewRate } : null,
        debts: (S.debts || []).map(d => ({ name: d.name, balance: d.bal, rate: d.rate, min: d.min })),
        savings: { cash: S.cash, tfsa: S.tfsa, rrsp: S.rrsp, nonreg: S.nonreg, tfsaRoom: S.tfsaRoom, rrspRoom: S.rrspRoom }, assumedReturn: S.ret,
        missingInfo: X.missing().map(x => x[1]) };
    }
    const j = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'chat', messages: S.chat, context }) }).catch(() => ({ error: 'Network error' }));
    S.chat.push({ role: 'assistant', content: j.error ? '⚠ ' + j.error + ' Your calculators still work without the AI.' : j.text }); busy = false; save(); render();
  };

  /* ---------- ONBOARDING step 3 ---------- */
  const oldOnboard = V.onboard;
  V.onboard = () => {
    if (ob !== 3) return oldOnboard();
    const own = S.profile.goal === 'own' || S.profile.goal === 'invest', ic = X.incomeCalc(), mc = X.mortgageCalc();
    return `<div class="ob"><div class="dots"><i class="on"></i><i class="on"></i><i class="on"></i></div>${head('Step 3 of 3', 'Your quick numbers', 'Rough figures are fine. We\u2019ll work out taxes and payments for you, and you can fine-tune everything later in My profile.')}
      <div class="card">
      ${X.select('fp.income.province', 'Which province or territory do you live in?', window.ECTax.provinces())}
      ${X.money('fp.income.salary', 'What is your annual salary before tax?', 'Before tax. Example: 85,000')}
      ${X.money('fp.income.bonus', 'What annual bonus do you expect?', 'Optional', { min: 0, optional: true })}
      ${ic.est ? `<div class="note" style="margin-bottom:16px">Estimated take-home: <b>${X.fmt(ic.est.netMonthly)}/month</b> ${X.badge('estimate')}</div>` : ''}
      ${X.money('budget.essentials.other', 'Essential living costs per month', own ? 'Groceries, utilities, insurance, transport. Not your mortgage.' : 'Rent, groceries, utilities, insurance, transport', { min: 0 })}
      ${X.money('budget.lifestyle.other', 'Everything else you spend per month', 'Eating out, shopping, subscriptions, travel', { min: 0 })}
      ${X.money('cash', 'Cash savings', '', { min: 0 })}
      ${own ? X.money('home', 'Home value (approx.)', '', { min: 0 }) + X.money('bal', 'Mortgage balance', '', { min: 0 }) + X.select('rtype', 'Fixed or variable rate?', ['Fixed', 'Variable'])
        + (S.rtype === 'Fixed' ? X.percent('rate', 'Mortgage interest rate', '', { min: 0, max: 25 }) : X.plain('adj', 'Your rate compared with prime (points)', 'e.g. −0.64 if prime minus 0.64%', { min: -5, max: 5 }))
        + X.plain('fp.mort.amortYears', 'Years left on your amortization', 'Example: 24.5', { min: 0.1, max: 40 })
        + X.select('fp.mort.freq', 'How often do you pay?', Object.keys(window.ECTax.FREQ))
        + X.dateField('maturity', 'When does your current mortgage term end / renew?')
        + (mc.est ? `<div class="note" style="margin-bottom:16px">Estimated payment: <b>${X.fmt2(mc.est.payment)}</b> ${mc.freq.toLowerCase()} ${X.badge('estimate')}</div>` : '')
        + X.money('fp.mort.actualPmt', 'Your actual payment (optional)', 'Principal + interest, per payment', { min: 0, optional: true })
        : X.money('buy.down', 'Savings for a down payment', '', { min: 0 })}
      <div class="row" style="margin-top:20px;justify-content:space-between"><button class="btn ghost" onclick="ob=2;render()">Back</button><button class="btn" onclick="finishOb()">See my financial overview</button></div></div></div>`;
  };
  window.finishOb = () => { S.profile.onboarded = true; if (S.rtype !== 'Fixed') S.rateMode = 'Live'; else S.rateMode = 'Manual'; S.migrationNotes = []; S.fp.notes = []; X.sync(); save(); try { applyRates(); } catch (e) {} go('home'); };

  /* ---------- NAVIGATION ---------- */
  I.debt = '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>';
  I.goal = '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>';
  I.wallet = '<path d="M4 7h14a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13.5" r="1.2"/>';
  I.more = '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>';
  I.user = '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>';
  const MAIN = [['home', 'Home', 'home'], ['budget', 'Budget', 'wallet'], ['debt', 'Debt & Mortgage', 'debt'], ['wealth', 'Investing', 'market'], ['goals', 'Goals', 'goal'], ['advisor', 'Copilot', 'ai']];
  const EXTRA = [['profile', 'My profile', 'user'], ['market', 'Market', 'market'], ['areas', 'Neighbourhoods', 'map'], ['settings', 'Settings', 'gear']];
  const MOBILE = [['home', 'Home', 'home'], ['budget', 'Budget', 'wallet'], ['debt', 'Debt', 'debt'], ['wealth', 'Invest', 'market'], ['advisor', 'Copilot', 'ai'], ['more', 'More', 'more']];
  // Extension-safe navigation slots; modified in place by ec-v13 without rebuilding the existing shell.
  window.EC_NAV = { MAIN, EXTRA, MOBILE };
  const LEGACY = { overview: 'home', plan: 'budget', numbers: 'profile' };
  V.more = () => `${head('More', 'Everything else')}<div class="list card">${[['goals', 'Goals & home buying', 'goal'], ...EXTRA].map(([k, l, i]) => `<div class="it" style="cursor:pointer;align-items:center" onclick="go('${k}')"><span class="moreic">${ic(i)}</span><h3 style="flex:1">${l}</h3><span class="mute">›</span></div>`).join('')}</div>`;
  const oldGo = go;
  window.go = (v, tab) => {
    v = LEGACY[v] || v;
    if (v === 'budget' && tab && tab !== 'budget') {
      if (tab === 'mortgage') { dTab = 'mortgage'; v = 'debt'; }
      else if (tab === 'strategy') v = 'wealth';
      else if (tab === 'goals' || tab === 'buy') { gTab = tab; v = 'goals'; }
      else if (tab === 'numbers') v = 'profile';
    }
    oldGo(v);
  };
  window.render = function () {
    if (LEGACY[cur]) cur = LEGACY[cur];
    if (!V[cur]) cur = 'home';
    const view = S.profile.onboarded ? cur : 'onboard';
    const btn = ([k, l, i]) => `<button class="nav ${k === view || (k === 'more' && ['goals', 'profile', 'market', 'areas', 'settings', 'more'].includes(view)) ? 'on' : ''}" onclick="go('${k}')">${ic(i)}<span>${l}</span></button>`;
    document.getElementById('side').innerHTML = S.profile.onboarded ? `<div class="logo"><svg viewBox="0 0 32 32">${I.logo}</svg>EquityClimb</div>${MAIN.map(btn).join('')}<div class="navsep"></div>${EXTRA.map(btn).join('')}<div class="grow"></div>
      <div class="ratechip">${prime() ? `<span class="dot"></span>Prime rate<b>${pct(prime(), 2)}</b>` : '<span class="dot off"></span>Rates offline'}</div>` : '';
    document.getElementById('tabbar').innerHTML = S.profile.onboarded ? MOBILE.map(btn).join('') : '';
    const ae = document.activeElement, keep = ae && ae.id;
    try { document.getElementById('view').innerHTML = V[view](); }
    catch (e) { console.error(e); document.getElementById('view').innerHTML = `<div class="note warnnote"><b>Something went wrong on this page.</b> Your data is safe. <a href="#" onclick="go('home');return false">Go to Home</a></div>`; }
    if (keep && document.getElementById(keep)) document.getElementById(keep).focus();
  };

  /* ---------- start ---------- */
  migrate();
  X.ensure();
  X.sync(); save();
  const h = location.hash.slice(1); cur = LEGACY[h] || (V[h] && h !== 'onboard' ? h : 'home');
  render();
})();
