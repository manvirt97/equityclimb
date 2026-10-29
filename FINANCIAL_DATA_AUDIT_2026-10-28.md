# EquityClimb Financial and Data Accuracy Audit — October 28, 2026

## Conclusion: NOT globally certified
This is a code, public-endpoint and mathematical audit of representative high-risk paths; it is not a claim that every private financial input, every vendor feed, or every jurisdiction-specific rule is correct. The repository tree contained 157 files. Core calculators, tax/rate/news/quote/MLS routes, refresh and install paths received targeted checks, not a line-by-line review of every source file.

## Key results
| Domain | Assessment | Remaining qualification |
|---|---|---|
| BoC overnight rate | Verified: policy 2.50% announced Oct 28, effective Oct 29 | Bank announcement vs daily statistical observation distinguished; publication/connection can lag |
| Lender prime | Verified: TD confirmed 4.70% effective Oct 29; BoC weekly 4.45% Oct 21 | Not an instantaneous guaranteed update for every Canadian lender |
| Existing mortgage | Canadian monthly assumptions and rate modes tested | Actual fixed/variable contract, payment, adjustment, trigger and remaining amortization are NOT lender-verified |
| Insured mortgage | Corrected estimated premium omission in ineligible scenarios | Hypothetical allowance never constitutes approval; CMHC/lender eligibility needs review |
| Federal/Alberta 2026 taxes | Official CRA bracket thresholds, CPP/EI and registered account annual caps cross-checked | Personal net pay, credits, tax filing, TFSA/RRSP available room not certified |
| 2027+ taxes | Estimated; tax rules endpoint labels year/status | Province-specific thresholds, CPP and credits provisional until government confirms; unsupported tax years rejected |
| Income, budget and net worth | Arithmetically derived from entered balances and transactions | No personal bank/broker statement reconciliation; not real account balances |
| Mortgage vs TFSA/RRSP and rental decisions | Illustrative scenario arithmetic | Tax, rental and investment assumptions, actual returns, legal terms not verified |
| Watchlist quotes | Yahoo/Stooq provider and real as-of timestamps displayed | Quote delay, last close, missing vendor data; not executable real-time prices |
| News and Deal Tracker | Dated public feeds; undated items no longer represented as just published | Provider failures, category crossover, headlines and AI deal extraction not independently fact-checked |
| Real estate | MLS API correctly returns disabled; manually saved homes allowed | No approved live MLS listings/property histories/prices |
| AI Copilot | Routable if provider enabled | Financial factual reliability, hallucinations and currentness NOT independently certified |
| PWA/iPhone | Foreground update/version mechanics and automated tests pass | Device-specific installations, offline modes and user data backup/restore require field tests |
| Account sync | Production config says sync enabled | Consent, authenticated account reconciliation and cross-device conflict handling not verified |

## Confirmed source references
- CRA 2026 tax brackets: https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
- CRA Alberta 2026 CPP/EI: https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032ab-jan/t4032ab-january-general-information.html
- CRA TFSA: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html
- CRA RRSP statutory caps: https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html
- CMHC mortgage-insurance price eligibility: https://www.cmhc-schl.gc.ca/consumers/home-buying/mortgage-loan-insurance-for-consumers/what-are-the-general-requirements-to-qualify-for-homeowner-mortgage-loan-insurance
- OSFI qualifying rate: https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks/minimum-qualifying-rate-uninsured-mortgages
- BoC Oct 28 announcement: https://www.bankofcanada.ca/2026/10/fad-press-release-2026-10-28/
- TD Oct 28 announcement: https://td.mediaroom.com/2026-10-28-TD-Canada-Trust-announces-change-to-TD-Prime-Rate

## v16.10 issues addressed
1. Some low-down-payment mortgages requiring insurance but not meeting eligibility rules omitted the hypothetical insurance allowance; the new model conservatively includes an estimated standard premium, explicitly warning that the loan may not qualify.
2. Initial startup could load historical daily-only rate data before official announcement-aware rates. Startup now requests the official announcement-aware route first and only falls back when needed.
3. Tax values falsely labeled wholly official despite estimated provincial credits; corrected to official_with_estimates. Unsupported tax years now return an error rather than a wrong-year substitute.
4. Stooq fallback could manufacture a fresh market-trade timestamp when none existed. Quote provider/timestamp/delay metadata and UTC-as-of display now make vendor age explicit.
5. Undated RSS, Currents and GDELT news previously defaulted to the current date. Undated items now are not represented as freshly published.
6. Financial data reliability panel under Settings checks official/public feeds and clearly separates manual inputs, estimates, and missing MLS authorization.
7. Independent cross-feed public source audit is scheduled twice per day in GitHub Actions. Failures appear in Actions; direct phone notification is not guaranteed.

## Automation limits
Rate updates are source-dependent, require an online app to refresh on screen, and cannot guarantee the next announcement appears the instant it is published. Scheduled GitHub Actions can fail or be delayed. Rules for later tax years are estimates until published. Manual values remain user-owned and are not silently replaced. Mortgage contract terms remain manually selected. A source check is not a validation of user financial statements.

## Areas still requiring authenticated/independent evidence
Real lender statements; mortgage payment frequency, compounding and trigger provisions; actual bank/broker balances; account sync and restore; all jurisdiction-specific tax credits/benefits; investment returns; legal closing fees; data vendor agreements; full news/AI fact-checking; MLS rights; security and accessibility audits; and real-device PWA coverage. This is a finance planning application with selectively live-sourced inputs, not a certified brokerage, lender or tax-filing system.

## Release validation
Run npm test, npm run syntax and live Cloudflare staging checks. Use fictional sample records for browser tests. After production deployment, check production release version and date-bearing API responses. Never delete the user's installed PWA or local data as an upgrade step.
