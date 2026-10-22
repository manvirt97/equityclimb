# Version 14.0 — October 2026

- Eliminates wasted Budget whitespace through deterministic independent columns; mobile remains numeric 1–5.
- Groups navigation into Your Money, Explore, Grow Your Knowledge and Account.
- Improves Homes with small premium hero, one-click city selection, saved housing search criteria, bathroom filter and contextual area map.
- Retains manual saved properties, existing financial tools and disabled-by-default MLS licensing safeguards.
- Clarifies Repliers eligibility limits and adds CREA DDF advertising website application guidance.

# EquityClimb Release Notes

## Version 13.0 — October 2026

### Added

- Housing Inventory / Homes page with city filters, buying and renting, minimum bedroom and price ranges.
- Server-side optional licensed Repliers feed, off by default, with page navigation and city-result counts when available.
- Interactive property card and optional pin map when authorized live coordinates are available.
- Saved manual property entries, broker/source link support, property comparison summary, and provider-ID-only MLS favorites.
- Financial Decision Lab estimating payment, full monthly carrying costs, upfront cash and interest-rate changes (+1/+2 percentage points).
- More useful Home entry points (Learn, Decide, Explore Homes) and optional weekly actions.
- Learn-to-Decision-Lab entry point.
- Consistent numbered Budget grid rather than reordering cards by height.
- Cloudflare service-worker asset list refresh.
- Zero-dependency financial-model / API tests.

### Known limitations and intentional safeguards

- Live MLS **requires a paid/approved licensed provider**. The app never pretends a sample listing is active.
- The current endpoint and field mapper are Repliers-specific and require real credentials for integration verification.
- Local browser testing verified new Home, Homes, shortlist and Decision Lab routes; real Cloudflare/Firebase/MLS integration could not be exercised without account credentials.
- Financial estimates omit default-insurance premiums, land transfer tax, lender underwriting and major repairs outside the input allowance.
- No real-time alert automation, banking connector or full nationwide market-statistics ingestion is included in this release.
- Before significant traffic, upgrade map tile hosting and monitor provider charges and abuse.
- A fuller refactor of the many v6–v12 screen overrides remains advisable as a separate stabilization project.
