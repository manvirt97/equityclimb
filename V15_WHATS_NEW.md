# EquityClimb v15 — Release notes and boundaries

## Implemented

- Premium light/dark visual refinement; carried forward the live v14.1 Prime-rate sidebar footer correction.
- Homebuying Guide with six stages and 18 user-checkable steps; province selection and regulator-resource links; saved in the same existing app state for normal backup/sync.
- Guided explanations from Copilot, with explicit distinction between self-guided education and regulated legal/real estate services.
- AI Auto router using Cloudflare Workers AI (three free-only options: fast, balanced, advanced). The default `auto` chooses a free option by simple topic routing, not guaranteed correctness. A free balanced fallback is possible when another free model fails.
- Optional three capability-tier connections for OpenAI and Claude through server-side credentials and explicit owner opt-in. No consumer Microsoft Copilot API connection is claimed.
- Per-network daily usage protection using your existing D1 binding, with private hashed network identifier; refusal when usage protection is unavailable.
- Owner-only model audit endpoint to inspect connected provider catalogs; human-reviewed promotion required.
- Source-neutral, rights-checked property record schema and honest `/api/homes?mode=sources` status endpoint to prepare for licensed feeds.
- Existing mortgage, goals, budgets, authentication, backup structure, news and learning screens preserved.

## Not included / not yet possible without external permission or costs

- Live access to all boards' Canadian MLS listings, sold prices, listing photos or other licensed content.
- Actual property transaction submission, negotiation, e-signing, payment or conveyancing.
- Free OpenAI or Anthropic API usage, free consumer Copilot as an API, or automatic provider upgrades without safety checks.
- Guarantees of investment, tax, lending or legal accuracy.

## Required for a production-grade public launch

Verify financial/tax rules against current official sources, complete external accessibility/security review, confirm consent and data-retention behavior, use monitored Cloudflare rate controls and alerting, test with a real D1 development environment, and run provider-specific integration tests with credentials and contracts. Current repo tests cover core arithmetic, routing, budget safety, license isolation and no-feed states, not full brokerage/licensing compliance.
