# EquityClimb v16.1 — Visible Refresh, Real Data Only

**Incremental cumulative ZIP:** built on the actual v16 package, which includes the v15.4 CREA DDF integration foundation. This is an actual code change, not just conceptual mockups. No real listing inventory is included.

## Main differences you can see

- **Home** now leads with a large dark navy/gold financial command-centre panel showing net worth, assets, liabilities and monthly cash flow. Financial figures use the user's saved input; missing income is explicitly identified rather than showing a meaningless negative surplus as actionable.
- Three additional financial KPI cards, a smarter next action, and a compact collapsible extra-balances section. Existing profile-completeness warnings are preserved under one expandable notice; hidden notices and their actions are still usable.
- **Real Estate** now has a visually new property-planning header and a connected step-by-step workspace: (1) find a real property at REALTOR.ca, (2) manually add it to My Shortlist, (3) compare costs in Decision Lab.
- The entire v16 fake-home collection (invented houses, prices and illustration cards) has been removed from the application JavaScript. It is **not** shown even when MLS is disconnected. User-entered property and saved-home tools remain.
- While no authorized listing feed is enabled, search inputs which cannot return inventory are suppressed, along with redundant city filters. When a permitted feed is enabled, existing results and search controls are retained.
- Legacy v16 sample-scenario settings are cleaned up. If someone previously clicked a fake listing, an unobtrusive review warning appears in the existing Decision Lab until the user confirms the saved scenario assumptions. Financial inputs are not silently deleted.
- Settings still provide mobile landing-page and navigation choices; sync functions remain available inside Advanced account & sync.
- Bank of Canada/rates outage messaging has been shortened to a compact status and Refresh action; it never labels an unavailable rate live.
- No subscription, referral fee, paywall or advertising screens.

## Still in the app from v16

Canadian mortgage default insurance estimate, down-payment rule guidance, cash-to-close and home readiness tools, Canadian toolkit with FHSA/TFSA/RRSP source links, printable financial report, AI context controls, mobile pinning, light default, learning and all budget/debt/goal modules.

## What this package does not claim

- No public MLS inventory, verified sold data, photographs or automatically imported listings. CREA DDF remains locked until approval, compliant display, lead workflow, analytics and deployment validation.
- No production Cloudflare, real customer-device, penetration or accessibility certification. Rates, professional advice, tax and lender qualification are not guaranteed.
- Browsers can retain an older service worker and files until the updated version is deployed and refreshed. See upgrade guide.

## Checks run

- `npm test`: **47 tests passed**.
- `npm run syntax`: JavaScript syntax checks passed.
- Offline Chromium smoke checks: dashboard, Real Estate, Home Readiness, Canadian Toolkit, Settings, Report and Markets at desktop and mobile. Zero uncaught browser errors or horizontal-overflow checks in the tested viewport.
- Interaction checks: Add your property opens My Shortlist and its user-entry form, Decision Lab remains accessible, mobile Settings retains five customization selectors, and synced-account controls remain collapsible.
- Preview screenshots show an **offline test profile** and should not be confused with a live account or the production website.
