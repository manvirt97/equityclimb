# EquityClimb v16.0 — Canadian Financial Intelligence Upgrade

**Release type:** full, cumulative upgrade from v15.4. Existing v15.4 DDF connector, Cloudflare Pages Functions, security flags, budgeting, investing, mortgage, AI, learning, goals, homebuying guide and local backup/sync functionality are retained. No subscription, paywall, advertising or referral revenue features have been added.

## What's included

### Visual quality and navigation
- Light/white is the default for **new** profiles. Users with an existing saved appearance preference keep their chosen light/dark theme.
- A personalized mobile first screen and four configurable bottom-navigation shortcuts, with Home and More always available. Settings are saved with the existing app state and can be included in a user-created backup.
- A less cluttered Settings screen: personalization and alert preferences are prominent, while the existing Accounts & device sync controls remain operational inside a collapsible section.
- The long Bank of Canada offline/stale-quote narrative is replaced by concise source/status disclosures. Data freshness and saved-rate caveats remain inspectable; we do **not** relabel stale rates as live.
- Added dedicated Home Readiness, Canadian Toolkit and Financial Report pages to desktop navigation and mobile More.

### Canadian mortgage calculation upgrades
- A 2026 Canadian insured-home down-payment estimator: 5% of the first $500,000, 10% above this up to $1.5M, and 20% when home price is $1.5M or more (general rules, subject to lender/product eligibility).
- Estimates applicable standard mortgage default-insurance premiums (tiered by loan-to-value), finances that premium into the mortgage principal, and includes resulting payment impact for otherwise eligible scenarios.
- Warns on insufficient down payments, ineligible insurance cases and scenarios requiring provider review. Provides a qualifying-rate comparison using the generally applicable uninsured federal stress-test formula, higher of 5.25% and contract rate + 2 points.
- Retains Canadian fixed-mortgage semi-annual compounding convention. Optional extra closing-cost entry and provincial-fee reminders in the Decision Lab.
- Estimates for 30-year insured amortization require user acknowledgement of eligibility; applicable premium surcharge or province-specific premium sales tax is **not automatically included**. Obtain a lender/insurer quote.

### Connected planning and housing
- Home dashboard: an additional context-aware action from the user's saved budget, debt, cash reserves and home planning, with optional in-app reminders/alerts.
- Home Readiness: user-adjustable home price, FHSA funds, protected cash reserve, extra monthly savings and comfortable household budget allocation. Displays illustrative monthly costs, cash-to-close, savings shortfall and time to reach target. Clearly distinguishes household comfort from mortgage qualification.
- Real Estate: labelled **fictional example homes** with price/carrying-cost demonstrations while MLS is unconnected; a clear link to external listings; retained manual saved-home entry and licensed-feed-ready UI. User-entered homes are compared on monthly cost, upfront cash and an illustrative +2% rate scenario.
- Canadian Toolkit: FHSA, TFSA/RRSP room guidance, mortgage default-insurance, potential first-time homebuyer new-home GST/HST rebate, official links and regional purchasing checklists. Province-specific tax and benefit eligibility are **not** automatically calculated.
- Financial Report: an exportable private CSV and printer-friendly browser Print / Save as PDF snapshot. Values come from user-entered data and are for planning, not verified banking statements.
- AI Copilot: additional personal-finance prompts and an explicit user choice before sharing financial context. Provider availability still depends on existing backend connections, rights and usage limits.
- Learning: an open-ended next-steps path rather than suggesting learning stops at the last built-in module.

## Important limitations / not claimed
- **No MLS inventory, sold prices or actual licensed listing photographs are connected.** The CREA DDF connector remains locked and requires approval, production rights, analytics and lead workflow verification before go-live. Do not turn the feed release flags on based on this package alone.
- Home example cards are fictional scenarios (CSS illustrations). They are not real homes for sale and do not scrape listing websites.
- App notifications are in-app when the application is used, **not** background push notifications or recurring cloud jobs.
- No live bank-account syncing, professional mortgage preapproval, advice license, guaranteed affordability, provincial fee calculator, or automatic bank/CRA integrations are added.
- Fees, lender eligibility, insurer exceptions, individual registered-account room and tax relief must be verified independently. Rules may change after this release.
- Browser smoke tests use simulated offline app/profile responses. They are **not** production Cloudflare, security-penetration, full accessibility, real iPhone or approved DDF integration testing.

## Automated checks
- `npm test`: **44 passing tests**, 0 failures.
- `npm run syntax`: JavaScript syntax checks passed.
- Offline Chromium viewport checks: Home, Real Estate, Home Readiness, Canadian Toolkit, Settings, Report and Markets at desktop and 390px mobile, plus saving mobile shortcut/landing page preferences. No runtime error/overflow was detected during these targeted smoke tests.

This app provides educational planning estimates only and must not be represented as a licensed brokerage, mortgage lender, tax professional or financial advisor.
