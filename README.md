# EquityClimb v16.0 — Canadian Financial Intelligence

A Canadian financial planning and homebuying Progressive Web App (PWA) built for Cloudflare Pages.

**Start here:**
- `V16_RELEASE_NOTES.md` — what is actually implemented and what is not.
- `V16_UPGRADE_GUIDE.md` — safe staging, backup, Cloudflare deployment and mobile checks.
- `CREA_DDF_LIVE_SETUP.md` — separately controlled *unconnected* REALTOR.ca / CREA DDF connection foundation.

## Deployment structure
- `public/`: app interface, JavaScript, CSS, PWA and service worker; new v16 assets `ec-v16.js`, `ec-v16.css`.
- `functions/`: Cloudflare Pages API routes and protected AI / approved-feed connectors.
- `tests/`: Node tests. Run `npm test`, then `npm run syntax`.
- `wrangler.toml`: existing Cloudflare configuration and bindings.

Cloudflare Pages static asset directory: `public`. Retain the live project's configured bindings, environment secrets and settings. Do not publish credentials in client-side source.

## Safety defaults
- No paid subscriptions, advertising, financial-product referral system or paywall.
- CREA / REALTOR.ca feed publishing is **not** approved or enabled; keep DDF and other feed availability flags OFF without a valid signed contract and verified attribution, lead and analytics requirements.
- Original paid AI provider usage remains owner opt-in (`ENABLE_PAID_AI=off` by default), and user financial context sharing is optional and off by default for new users.
- Canadian calculations are illustrations, not mortgage offers, verified bank balances, or professional financial advice. Verify legal/tax/regulatory details prior to a real-world decision.

See the release notes for all limitations, especially real-device, security and live integration testing.
