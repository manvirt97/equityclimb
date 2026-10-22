# EquityClimb v15.2 Release Notes

- Corrected iOS Home Screen PWA header clipping using `env(safe-area-inset-top)` on all mobile pages.
- Reordered Home to put existing net worth, monthly cash flow, projections, financial opportunities and Market first; new Homeownership Path and weekly guidance follows afterward.
- Replaced overlong AI provider selector with optgroups and a separate collapsible connection-status area for OpenAI and Anthropic.
- Paid provider modes remain disabled without explicit owner-provided encrypted secrets, tested model IDs and paid opt-in.
- Kept old localStorage schema, app sync, financial calculations, and Cloudflare setup; bumped service worker cache for updates.
- Live MLS inventory still requires provider licensing and is not enabled.

Tests: original 19 automated checks plus updated source/layout checks, syntax validation, Chromium DOM smoke test. Device-specific iOS safe-area display still requires a real iPhone test after deployment.
