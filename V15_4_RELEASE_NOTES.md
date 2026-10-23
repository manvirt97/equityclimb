# EquityClimb v15.4 — CREA DDF Connection Foundation

This release is an incremental technical upgrade on **v15.3**, not a replacement of the budget or financial experience.

## Added

- Server-side OAuth 2.0 adapter for the official DDF Web API. Credentials stay as Cloudflare Secrets.
- Validated OData property search queries for city, price, bedrooms, bathrooms and condo/freehold where supported by the approved feed metadata.
- RESO-style listing normalization including MLS identifiers, pictures, province/city context, pricing and internet-address privacy flags.
- Feed-source status showing whether connection credentials are present and whether display has been approved.
- Owner-only credential diagnostic endpoint and a beginner-friendly connection-check page.
- Official branded attribution support for eligible DDF listing cards.
- Six new tests covering disabled state, URL validation, OAuth, field normalization, owner-only diagnostics and endpoint permissions.
- Updated service-worker version to load the new small frontend files.

## Not live yet

No approved feed credentials or executed CREA contract were available in this project. We have not connected a real property inventory, validated DDF production records, verified the CREA Lead API, completed analytics integration or obtained nationwide board rights. Therefore the DDF public display flags remain **off**. Avoid claiming full Canadian MLS coverage or that EquityClimb replaces legally required professional services.

If licensed credentials become available, the backend can verify OAuth and fetch standardized response data for integration testing. Full public go-live requires CREA consent, completed agent inquiry and analytics workflows, source-specific field mapping and an independently reviewed deployment.

## Tests

`npm test` (31 automated tests) and `npm run syntax` passed. Network access to local Chromium test pages was blocked by the testing environment; live Cloudflare and actual iPhone tests have not been performed.
