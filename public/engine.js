/* EquityClimb Financial Engine v6.0
   One place for every calculation. No screen code here, so it can be unit-tested (see tests/engine.test.js).
   Conventions:
   - Money is monthly unless stated. Rates are annual percentages (5 = 5%).
   - Mortgage interest: nominal annual rate converted to an exact monthly rate using the chosen compounding
     (Canadian fixed = semi-annual; many variable mortgages = monthly - check your contract).
   - Payments at the end of each month; investment contributions at the start of each month.
   - At renewal the rate changes; the payment becomes the HIGHER of today's payment or the payment needed
     to finish within the remaining amortization.
   - Projections are estimates, not guarantees. */
(function (root) {
  'use strict';

  const ASSUMPTIONS = {
    version: '2026.1', effective: '2026-01-01',
    note: 'Defaults only. Confirm contribution room with CRA My Account and mortgage terms with your lender.',
    stressFloor: 5.25, stressBuffer: 2, gdsMax: 39, tdsMax: 44, nonRegTaxDrag: 0.6, emergencyMonths: 3
  };

  const num = v => (Number.isFinite(+v) ? +v : 0);

  function periodicRate(annualPct, compounding = 'Semi-annual', periodsPerYear = 12) {
    const r = num(annualPct) / 100;
    if (!r) return 0;
    const m = compounding === 'Monthly' ? 12 : compounding === 'Annual' ? 1 : 2;
    return Math.pow(1 + r / m, m / periodsPerYear) - 1;
  }

  function payment(principal, annualPct, years, compounding = 'Semi-annual', periodsPerYear = 12) {
    const P = num(principal), i = periodicRate(annualPct, compounding, periodsPerYear), n = Math.round(num(years) * periodsPerYear);
    if (P <= 0) return 0;
    if (n <= 0) return P;
    return i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n;
  }

  function monthsToRepay(balance, annualPct, pmt, compounding = 'Semi-annual') {
    const b = num(balance), i = periodicRate(annualPct, compounding), p = num(pmt);
    if (b <= 0) return 0;
    if (p <= 0) return Infinity;
    if (!i) return Math.ceil(b / p);
    if (p <= b * i) return Infinity;
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
          if (o.amortMonths) {
            const left = Math.max(o.amortMonths - m, 1);
            const need = i ? b * i / (1 - Math.pow(1 + i, -left)) : b / left;
            pay = Math.max(pay, need);
          }
        }
        let interest = 0, freed = 0, principal = 0;
        if (b > 0) {
          interest = b * i;
          const nb = b + interest - (pay + num(extra));
          if (nb < 0) { freed = -nb; principal = b; b = 0; } else { principal = b - nb; b = nb; }
        } else freed = pay + num(extra);
        m++;
        return { interest, principal, freed };
      }
    };
  }

  function amortize(o) {
    const st = mortgageStepper(o), max = o.maxMonths || 600, lumpMonth = o.lumpMonth ?? 0;
    const lump = Math.min(num(o.lump), o.lumpCap == null ? Infinity : num(o.lumpCap));
    let interest = 0, firstInterest = null, firstPrincipal = null; const path = [st.balance];
    while (st.balance > 0.005 && st.month < max) {
      const extra = num(o.extra) + (lump && st.month % 12 === lumpMonth ? lump : 0);
      const r = st.step(extra);
      interest += r.interest;
      if (firstInterest == null) { firstInterest = r.interest; firstPrincipal = r.principal; }
      if (st.month % 12 === 0) path.push(st.balance);
      if (st.month === 1 && r.principal <= 0) break;
    }
    const done = st.balance <= 0.005;
    if (done && path[path.length - 1] !== 0) path.push(0);
    return { months: done ? st.month : Infinity, interest, path, firstInterest: firstInterest || 0, firstPrincipal: firstPrincipal || 0,
      finalPayment: st.payment, negativeAmortization: !done && (firstPrincipal || 0) <= 0 };
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
      m++;
      ds.forEach(d => { if (d.b <= 0.005 && d.paid == null) { d.b = 0; d.paid = m; } });
      if (m % 12 === 0) path.push(ds.reduce((s, d) => s + d.b, 0));
    }
    const ok = !ds.some(d => d.b > 0.005);
    if (ok && path[path.length - 1] !== 0) path.push(0);
    return { months: ok ? m : Infinity, interest: total, monthlyBudget: budget, path, warnings,
      debts: ds.map(d => ({ name: d.name, paidMonth: d.paid, interest: d.int })), order: order.map(d => d.name) };
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
    const cap = (num(p.origP) || num(p.balance)) * num(p.prepayPct ?? 15) / 100;
    const out = {};
    {
      const M = mortgageStepper(p); let nr = 0, used = 0, capped = false;
      for (let m = 0; m < N; m++) {
        if (m % 12 === 0) used = 0;
        const a = M.balance > 0 ? Math.max(0, Math.min(X, cap - used)) : 0; if (a < X && M.balance > 0) capped = true; used += a;
        const r = M.step(a); nr = (nr + r.freed + X - a) * (1 + gN);
      }
      out.prepay = { net: nr - M.balance, invested: nr, mortgage: M.balance, capped };
    }
    {
      const M = mortgageStepper(p); let room = num(p.tfsaRoom), t = 0, nr = 0;
      for (let m = 0; m < N; m++) {
        if (m > 0 && m % 12 === 0) room += num(p.tfsaNew);
        const r = M.step(0), c = X + r.freed, a = Math.min(c, room); room -= a;
        t = (t + a) * (1 + g); nr = (nr + c - a) * (1 + gN);
      }
      out.tfsa = { net: t + nr - M.balance, invested: t + nr, mortgage: M.balance };
    }
    {
      const M = mortgageStepper(p); let rr = num(p.rrspRoom), troom = num(p.tfsaRoom), r = 0, t = 0, nr = 0, yc = 0, pending = 0;
      for (let m = 0; m < N; m++) {
        if (m > 0 && m % 12 === 0) { rr += num(p.rrspNew); troom += num(p.tfsaNew); pending = yc; yc = 0; }
        let toT = 0, toN = 0;
        if (m % 12 === 3 && pending > 0) { const ref = pending * num(p.mtr) / 100, a = Math.min(ref, troom); troom -= a; toT += a; toN += ref - a; pending = 0; }
        const s = M.step(0), c = Math.min(X, rr); rr -= c; yc += c;
        const rest = X - c + s.freed, a = Math.min(rest, troom); troom -= a; toT += a; toN += rest - a;
        r = (r + c) * (1 + g); t = (t + toT) * (1 + g); nr = (nr + toN) * (1 + gN);
      }
      out.rrsp = { net: r * (1 - num(p.retTax) / 100) + t + nr - M.balance, invested: r + t + nr, mortgage: M.balance };
    }
    return out;
  }

  function budgetTotals(b) {
    const sum = o => Object.values(o || {}).reduce((s, v) => s + num(v), 0);
    const income = sum(b.income), essentials = sum(b.essentials), lifestyle = sum(b.lifestyle), debt = sum(b.debt), savings = sum(b.savings);
    return { income, essentials, lifestyle, living: essentials + lifestyle, debt, savings, unallocated: income - essentials - lifestyle - debt - savings };
  }

  const toMonthly = (amount, freq) => num(amount) * ({ Weekly: 52 / 12, Biweekly: 26 / 12, 'Semi-monthly': 2, Monthly: 1, Annual: 1 / 12 }[freq] || 1);
  function minDownPayment(price) { const p = num(price); return p <= 500000 ? p * 0.05 : p < 1500000 ? 25000 + (p - 500000) * 0.10 : p * 0.20; }
  const insurancePremium = d => d >= 0.2 ? 0 : d >= 0.15 ? 0.028 : d >= 0.10 ? 0.031 : 0.04;
  function qualifyingRate(contractRate) { return Math.max(ASSUMPTIONS.stressFloor, num(contractRate) + ASSUMPTIONS.stressBuffer); }

  const api = { ASSUMPTIONS, periodicRate, payment, monthsToRepay, mortgageStepper, amortize, debtPlan, grow, compareStrategies, budgetTotals, toMonthly, minDownPayment, insurancePremium, qualifyingRate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ECEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
