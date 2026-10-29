// EquityClimb v7 - yearly Canadian rules that update themselves.
// How it works (no manual updates needed):
//   1. 2026 values below are the official base year.
//   2. For a new year, the law says most amounts grow by an "indexation factor":
//      average CPI for the 12 months ending Sept 30, divided by the 12 months before, minus 1 (Income Tax Act s.117.1).
//   3. We first look for the factor CRA has published. If CRA hasn't published it yet, we calculate it
//      ourselves from Statistics Canada's CPI data, using the same formula.
//   4. Results are cached for 12 hours so this runs at most a couple of times a day.
// Values that cannot be calculated by formula (e.g. CPP ceiling, provincial rules) are clearly marked "estimate".

const BASE_YEAR = 2026;
const B = pairs => pairs.map(([upTo, rate]) => ({ upTo, rate }));
const INF = Infinity;

// Same numbers as the app's built-in 2026 table (phase1.js) so nothing changes for 2026.
export const BASE = {
  label: '2026',
  federal: {
    brackets: B([[58523, 0.14], [117045, 0.205], [181440, 0.26], [258482, 0.29], [INF, 0.33]]),
    bpaMax: 16452, bpaMin: 14829, bpaPhaseStart: 181440, bpaPhaseEnd: 258482,
    employmentAmount: 1501, quebecAbatement: 0.165
  },
  cpp: { exemption: 3500, ympe: 74600, yampe: 85000, rate: 0.0595, baseRate: 0.0495, rate2: 0.04 },
  qpp: { exemption: 3500, ympe: 74600, yampe: 85000, rate: 0.064, baseRate: 0.054, rate2: 0.04, approx: true },
  ei: { mie: 68900, rate: 0.0163, rateQC: 0.0130 },
  qpip: { mie: 103000, rate: 0.00494, approx: true },
  provinces: {
    AB: { name: 'Alberta', bpa: 22769, brackets: B([[61200, 0.08], [154259, 0.10], [185111, 0.12], [246813, 0.13], [370220, 0.14], [INF, 0.15]]) },
    BC: { name: 'British Columbia', bpa: 13216, brackets: B([[50363, 0.056], [100728, 0.077], [115648, 0.105], [140430, 0.1229], [190405, 0.147], [265545, 0.168], [INF, 0.205]]) },
    MB: { name: 'Manitoba', bpa: 15780, brackets: B([[47564, 0.108], [101200, 0.1275], [INF, 0.174]]) },
    NB: { name: 'New Brunswick', bpa: 13664, approx: true, brackets: B([[52333, 0.094], [104666, 0.14], [193861, 0.16], [INF, 0.195]]) },
    NL: { name: 'Newfoundland and Labrador', bpa: 11188, approx: true, brackets: B([[44678, 0.087], [89354, 0.145], [159528, 0.158], [223340, 0.178], [285319, 0.198], [570638, 0.208], [1141275, 0.213], [INF, 0.218]]) },
    NS: { name: 'Nova Scotia', bpa: 11932, approx: true, brackets: B([[30995, 0.0879], [61991, 0.1495], [97417, 0.1667], [157124, 0.175], [INF, 0.21]]) },
    NT: { name: 'Northwest Territories', bpa: 18198, approx: true, brackets: B([[53003, 0.059], [106009, 0.086], [172346, 0.122], [INF, 0.1405]]) },
    NU: { name: 'Nunavut', bpa: 19659, approx: true, brackets: B([[55801, 0.04], [111602, 0.07], [181439, 0.09], [INF, 0.115]]) },
    ON: { name: 'Ontario', bpa: 12989, brackets: B([[53891, 0.0505], [107785, 0.0915], [150000, 0.1116], [220000, 0.1216], [INF, 0.1316]]),
          surtax: [{ over: 5818, rate: 0.20 }, { over: 7446, rate: 0.36 }], healthPremium: true },
    PE: { name: 'Prince Edward Island', bpa: 14650, approx: true, brackets: B([[33928, 0.095], [65820, 0.1347], [106890, 0.166], [142520, 0.1762], [200000, 0.19], [INF, 0.20]]) },
    QC: { name: 'Quebec', bpa: 18952, approx: true, noPayrollCredits: true, brackets: B([[54345, 0.14], [108680, 0.19], [132245, 0.24], [INF, 0.2575]]) },
    SK: { name: 'Saskatchewan', bpa: 20381, approx: true, brackets: B([[54532, 0.105], [155805, 0.125], [INF, 0.145]]) },
    YT: { name: 'Yukon', bpa: 16452, brackets: B([[58523, 0.064], [117045, 0.09], [181440, 0.109], [500000, 0.128], [INF, 0.15]]) }
  }
};
const BASE_LIMITS = { tfsa: 7000, tfsaUnrounded: 7185, rrsp: 33810, fhsaAnnual: 8000, fhsaLifetime: 40000 };
// Amounts governments have already announced for future years (picked up automatically once that year arrives).
const ANNOUNCED = {
  2027: { rrsp: 35390, ei: { mie: 70800, maxPremium: 1161.12 } }
};
// Thresholds that are fixed in law and are NOT indexed.
const NOT_INDEXED = { ON: [150000, 220000] };
const CPI_VECTOR = 41690973; // Statistics Canada, CPI all-items, Canada (not seasonally adjusted)

const r1000 = x => Math.round(x * 1000) / 1000;
const idx = (amt, f) => (amt === INF || amt == null) ? amt : Math.round(amt * (1 + f));
const clone = o => JSON.parse(JSON.stringify(o, (k, v) => v === INF ? '__INF__' : v), (k, v) => v === '__INF__' ? INF : v);

async function timed(url, opt = {}, ms = 7000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opt, signal: c.signal }); } finally { clearTimeout(t); }
}

// 1) CRA's published indexation rate for a tax year, e.g. "The indexation for the 2027 tax year is 2.6%".
async function craFactor(year) {
  try {
    const r = await timed('https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html', { headers: { 'User-Agent': 'EquityClimb/7.0' } });
    if (!r.ok) return null;
    const html = (await r.text()).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    const re = new RegExp(`${year}\\s+(?:tax\\s+)?year[^.%]{0,90}?(\\d{1,2}(?:\\.\\d)?)\\s*%`, 'i');
    const m = html.match(re);
    if (m) { const v = +m[1] / 100; if (v >= 0 && v < 0.15) return v; }
  } catch {}
  return null;
}

// 2) Our own calculation from Statistics Canada CPI (same formula as the Income Tax Act).
async function cpiFactor(year) {
  try {
    const r = await timed('https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify([{ vectorId: CPI_VECTOR, latestN: 48 }])
    });
    if (!r.ok) return null;
    const j = await r.json();
    const pts = (j?.[0]?.object?.vectorDataPoint || []).map(p => ({ d: String(p.refPer).slice(0, 7), v: +p.value })).filter(p => p.v > 0);
    const val = Object.fromEntries(pts.map(p => [p.d, p.v]));
    const months = (endY) => { const out = []; for (let k = 0; k < 12; k++) { const d = new Date(Date.UTC(endY - 1, 9 + k, 1)); out.push(d.toISOString().slice(0, 7)); } return out; }; // Oct(endY-1)..Sep(endY)
    const cur = months(year - 1), prev = months(year - 2);
    const have = cur.filter(m => val[m] != null);
    if (have.length < 6) return null;
    // If some recent months aren't released yet, compare the same months in both windows (early estimate).
    const avg = list => list.reduce((s, m) => s + val[m], 0) / list.length;
    const pairIdx = cur.map((m, k) => k).filter(k => val[cur[k]] != null && val[prev[k]] != null);
    const A = avg(pairIdx.map(k => cur[k])), Bv = avg(pairIdx.map(k => prev[k]));
    return { factor: r1000(A / Bv - 1), complete: pairIdx.length === 12, monthsUsed: pairIdx.length, latest: have[have.length - 1] };
  } catch { return null; }
}

function indexTable(prev, f, year) {
  const t = clone(prev);
  t.label = String(year);
  const F = t.federal;
  F.brackets = F.brackets.map(b => ({ upTo: idx(b.upTo, f), rate: b.rate }));
  F.bpaMax = idx(F.bpaMax, f); F.bpaMin = idx(F.bpaMin, f);
  F.bpaPhaseStart = F.brackets[2].upTo; F.bpaPhaseEnd = F.brackets[3].upTo;
  F.employmentAmount = idx(F.employmentAmount, f);
  for (const [code, p] of Object.entries(t.provinces)) {
    // Alberta: the lesser of 2% and inflation. Others: inflation (each province uses its own CPI; national CPI is used as a close estimate).
    const pf = code === 'AB' ? Math.min(0.02, f) : f;
    const fixed = NOT_INDEXED[code] || [];
    p.brackets = p.brackets.map(b => ({ upTo: fixed.includes(b.upTo) ? b.upTo : idx(b.upTo, pf), rate: b.rate }));
    p.bpa = idx(p.bpa, pf);
    if (p.surtax) p.surtax = p.surtax.map(s => ({ over: idx(s.over, pf), rate: s.rate }));
    p.approx = true;
  }
  // CPP ceiling follows wage growth, not prices. Until CRA publishes it (usually early November), assume ~4% wage growth.
  const ympe = Math.floor(t.cpp.ympe * 1.04 / 100) * 100, yampe = Math.floor(ympe * 1.14 / 100) * 100;
  t.cpp = { ...t.cpp, ympe, yampe, approx: true }; t.qpp = { ...t.qpp, ympe, yampe, approx: true };
  const ann = ANNOUNCED[year]?.ei;
  if (ann) t.ei = { mie: ann.mie, rate: Math.round(ann.maxPremium / ann.mie * 10000) / 10000, rateQC: t.ei.rateQC };
  else t.ei = { ...t.ei, mie: Math.round(t.ei.mie * 1.03 / 100) * 100, approx: true };
  return t;
}

async function cacheGet(key) { try { const r = await caches.default.match(key); return r ? await r.json() : null; } catch { return null; } }
async function cachePut(key, data, ttl) { try { await caches.default.put(key, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` } })); } catch {} }

// Public: rules for a given tax year.
export async function getRules(year = new Date().getFullYear()) {
  year = Math.max(BASE_YEAR, Math.min(year, BASE_YEAR + 3));
  const key = `https://equityclimb.internal/rules/v8-audit/${year}`;
  const hit = await cacheGet(key); if (hit) return hit;
  // Some provincial credits and QPP details are estimates even for the base year.
  let table = clone(BASE), limits = { ...BASE_LIMITS }, status = 'official_with_estimates', notes = ['2026 federal and Alberta brackets, CPP, EI and registered-account annual limits are sourced from CRA. Some provincial credits and QPP details remain estimates. Do not treat estimated net pay as a tax filing result.'], factors = {};
  for (let y = BASE_YEAR + 1; y <= year; y++) {
    let f = await craFactor(y), how = 'CRA';
    if (f == null) { const c = await cpiFactor(y); if (c) { f = c.factor; how = c.complete ? 'Statistics Canada CPI (full year)' : `Statistics Canada CPI (early estimate, ${c.monthsUsed} of 12 months)`; } }
    if (f == null) { f = 0.02; how = 'assumed 2.0% (data not available yet)'; }
    factors[y] = { factor: f, source: how };
    if (how !== 'CRA') status = 'estimated';
    table = indexTable(table, f, y);
    limits.tfsaUnrounded = limits.tfsaUnrounded * (1 + f);
    limits.tfsa = Math.round(limits.tfsaUnrounded / 500) * 500;
    limits.rrsp = ANNOUNCED[y]?.rrsp ?? Math.round(limits.rrsp * 1.03);
  }
  if (year > BASE_YEAR) notes.push('Tax brackets, basic personal amounts and the TFSA limit use the official indexation formula. Provincial amounts, CPP ceilings and anything not yet announced are estimates until governments publish them.');
  const out = {
    year, status, factors, checked: new Date().toISOString(),
    table: JSON.parse(JSON.stringify(table, (k, v) => v === INF ? null : v)),
    limits: { tfsa: limits.tfsa, rrsp: limits.rrsp, fhsaAnnual: limits.fhsaAnnual, fhsaLifetime: limits.fhsaLifetime },
    mortgage: { stressFloor: 5.25, stressBuffer: 2, gdsMax: 39, tdsMax: 44, minDown: '5% to $500k, 10% to $1.5M, 20% above', insurance: { '5-9.99%': 4.0, '10-14.99%': 3.1, '15-19.99%': 2.8 } },
    notes
  };
  await cachePut(key, out, 12 * 3600);
  return out;
}

// Short plain-text fact sheet for the AI, so it never relies on old memory for numbers that change.
export function factSheet(r, today = new Date()) {
  const t = r.table, f = t.federal;
  const br = f.brackets.map(b => `${(b.rate * 100).toFixed(1)}%${b.upTo ? ' up to $' + b.upTo.toLocaleString('en-CA') : ' above'}`).join(', ');
  return [
    `Today is ${today.toISOString().slice(0, 10)}. Tax year ${r.year} (${r.status}).`,
    `Federal brackets: ${br}. Federal basic personal amount up to $${f.bpaMax.toLocaleString('en-CA')}.`,
    `TFSA annual limit ${r.year}: $${r.limits.tfsa.toLocaleString('en-CA')}. RRSP dollar limit ${r.year}: $${r.limits.rrsp.toLocaleString('en-CA')}. FHSA: $${r.limits.fhsaAnnual.toLocaleString('en-CA')}/yr, $${r.limits.fhsaLifetime.toLocaleString('en-CA')} lifetime.`,
    `CPP: ${(t.cpp.rate * 100).toFixed(2)}% on earnings $${t.cpp.exemption.toLocaleString('en-CA')}-$${t.cpp.ympe.toLocaleString('en-CA')}${t.cpp.approx ? ' (estimate)' : ''}. EI: ${(t.ei.rate * 100).toFixed(2)}% up to $${t.ei.mie.toLocaleString('en-CA')}.`,
    `Mortgage stress test: higher of ${r.mortgage.stressFloor}% or contract rate + ${r.mortgage.stressBuffer}%. Debt limits ${r.mortgage.gdsMax}% GDS / ${r.mortgage.tdsMax}% TDS. Minimum down payment ${r.mortgage.minDown}.`
  ].join('\n');
}
