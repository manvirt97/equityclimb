/* EquityClimb transparent, testable home ownership model. CAD; education not underwriting. */
(function(root, factory) { const x = factory(); if (typeof module === 'object' && module.exports) module.exports = x; root.ECMoney = x; })(typeof globalThis !== 'undefined' ? globalThis : window, function() {
  'use strict';
  const finite = (v, d=0) => v === '' || v == null || !Number.isFinite(+v) ? d : +v;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, finite(v,a)));
  function monthlyRate(annualPct, fixed = true) {
    const r = clamp(annualPct, 0, 30) / 100;
    // Standard Canadian fixed-rate convention: semiannual nominal compounding, monthly payment equivalent.
    return fixed ? Math.pow(1 + r / 2, 1/6) - 1 : r / 12;
  }
  function mortgagePayment(principal, rate, years, fixed=true) {
    const P = Math.max(0, finite(principal)); const n = Math.round(clamp(years, 1, 40) * 12);
    const i = monthlyRate(rate, fixed);
    return i === 0 ? P / n : P * i / (1-Math.pow(1+i,-n));
  }
  function ownership(input) {
    const price = clamp(input.price, 0, 20000000), down = clamp(input.down, 0, price);
    const principal = price - down; const rate = clamp(input.rate, 0, 30), years = clamp(input.years, 1, 40);
    const mortgage = mortgagePayment(principal, rate, years, input.fixed !== false);
    const propertyTax = clamp(input.tax, 0, 20000);
    const insurance = clamp(input.insurance, 0, 10000);
    const utilities = clamp(input.utilities, 0, 10000);
    const condo = clamp(input.condo, 0, 10000);
    const maintenance = price * clamp(input.maintenancePct, 0, 10) / 100 / 12;
    const total = mortgage + propertyTax + insurance + utilities + condo + maintenance;
    const closingPct = clamp(input.closingPct, 0, 10);
    const closing = price * closingPct / 100;
    const gross = Math.max(0, finite(input.netIncome));
    const nonHousing = Math.max(0, finite(input.nonHousing));
    const room = gross - nonHousing - total;
    return { price, down, principal, mortgage, propertyTax, insurance, utilities, condo, maintenance,
      total, closing, upfront: down + closing, cashAfterClosing: finite(input.cash) - down - closing,
      room, rate, years, loanToValue: price ? principal/price : 0,
      // This model intentionally excludes mortgage default insurance premiums and lender qualification.
      requiresInsuranceReview: price > 0 && down / price < 0.20,
      caution: 'Illustrative monthly cash flow only. Excludes mortgage default-insurance premiums, land transfer taxes, financing costs, repairs beyond the allowance, and income-tax effects. Not a lender qualification.' };
  }
  return { monthlyRate, mortgagePayment, ownership };
});
