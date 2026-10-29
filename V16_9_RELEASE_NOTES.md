# EquityClimb v16.9 — Mortgage Rate Integrity and Payment Behaviour

## What changed
- Bank prime announced on a BoC decision day is verified against lender sources and applied to `Live + Variable` saved mortgage-rate calculations on the **effective date**, even if the Bank of Canada's weekly statistical series lags.
- The BoC server now discovers future dated TD prime announcements from the official media room rather than relying only on a fixed October 2026 link. An official posted prime-rate table and previously known dated announcements remain fallbacks. The app cannot guarantee instant detection if the lender website has not published or is unavailable.
- New **Debt & Mortgage → Mortgage** card models three structures: contractual fixed-rate; variable-rate with a fixed monthly payment (payoff period changes); variable-rate with an adjustable monthly payment (payment changes to hold user-entered remaining amortization).
- The two variable mortgage modes must be selected by the user. Actual existing payment `S.pmt` and mortgage balance `S.bal` are **never automatically replaced**; these are not verified lender balances.
- A clearly marked, reversible opt-in lets the user's live mortgage-rate assumption flow into Real Estate and Shortlist ownership calculations using variable compounding. The original independent property interest rate and compounding flag are restored on opt-out. **Opt-in is off by default.**
- Show confirmed bank-prime source, effective date and refresh age; flag unavailable/old data. Existing dashboard and Shortlist layouts are unchanged.
- Public rate health is checked twice daily by `.github/workflows/equityclimb-rate-integrity.yml`. Failed checks appear as GitHub Actions failures; direct user notifications depend on their GitHub notification preferences. This is not a guarantee against all inaccurate data.

## What is *not* verified or connected
- No authenticated lender integration: the app does not know the user's bank-specific interest schedule, compounding, payment frequency, interest adjustment date, prepayment clause, trigger rate or actual remaining amortization. These must be checked against the mortgage contract.
- Monthly mortgage estimates are **illustrative**, not a banking statement, amortization schedule, or lender-issued payment notice.
- The Budget, Home, tax, property value, investments, exchange rates, news and other financial modules retain their separate assumptions and source freshness. Passing the rate and mortgage tests **does not certify every other app number**; a separate page-by-page audit is still needed.
- Bank of Canada policy rate and bank prime are different, and a lender can choose its own prime. BoC announcements are not automatic payment-change instructions.
- The phone app checks for updated source and application versions when online and open/in foreground, but there is no guaranteed closed-app background refresh or push notification.

## Verification
- `npm test`, `npm run syntax`, and new `tests/mortgage-rate-modes.test.mjs`.
- Real Cloudflare staging API `/api/boc?fresh=1`: prime 4.45% observed October 21, 4.70% announced effective October 29; policy target 2.50% announced October 28.
- Staging UI guest test: both variable payment controls work; keeping a $2,400 payment in a simulated 450k mortgage extended payoff from ~24.4 to 25.5 years when rate rose 3.95% → 4.20%; adjustable mode maintained 25 years with an estimated payment change. **Illustrative example only; not the user's mortgage.**

## Public guidance
- Financial Consumer Agency of Canada: https://www.canada.ca/en/financial-consumer-agency/services/mortgages/interest-on-mortgages.html
- FCAC trigger rates and negative amortization: https://www.canada.ca/en/financial-consumer-agency/services/interest-rates-rise.html
